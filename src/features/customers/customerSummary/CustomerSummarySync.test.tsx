import { StrictMode } from 'react';
import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseApi } from '@/api/baseApi';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerSummarySync } from './CustomerSummarySync';
import { customerSummaryApi } from './customerSummary.api';
import { selectCustomerSummary, selectCustomerSummaryStatus } from './customerSummary.selectors';
import type { CustomerSummaryResponse } from './customerSummary.types';

const NativeRequest = globalThis.Request;
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

function createResponse(fullName: string): Response {
  const body: CustomerSummaryResponse = {
    fullName,
    grid: 'PL12345678',
    corporateGroupName: null,
    corporateGroupGrid: null,
    internalGroupName: null,
    pamLam: null,
    homeCountry: null,
    segmentColor: null,
    rating: 'AAA',
    status: 'ACTIVE',
    kkf: null,
    pamName: null,
    lendingRatingDate: null,
    cddRiskLevel: null,
    cddExpirationDate: null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomerSummarySync', () => {
  it('fetches once under StrictMode and never exposes the previous customer while switching', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    let resolveSecond: ((response: Response) => void) | undefined;
    const pendingSecond = new Promise<Response>((resolve) => {
      resolveSecond = resolve;
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const request = input instanceof NativeRequest ? input : new NativeRequest(input);
      if (new URL(request.url).pathname.includes('/second/')) return pendingSecond;
      return createResponse('First Customer');
    });
    vi.stubGlobal('fetch', fetchMock);

    const view = renderWithProviders(
      <StrictMode>
        <CustomerSummarySync customerId="first" />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(selectCustomerSummaryStatus(view.store.getState(), 'first')).toBe('succeeded');
    });
    expect(selectCustomerSummary(view.store.getState(), 'first')?.fullName).toBe('First Customer');
    expect(fetchMock).toHaveBeenCalledOnce();

    view.rerender(
      <StrictMode>
        <CustomerSummarySync customerId="second" />
      </StrictMode>,
    );

    expect(view.store.getState().customerSummary).toEqual({
      customerId: 'second',
      data: null,
      status: 'loading',
    });
    expect(selectCustomerSummary(view.store.getState(), 'first')).toBeNull();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select('first')(view.store.getState())
          .status,
      ).toBe('uninitialized');
    });

    act(() => {
      resolveSecond?.(createResponse('Second Customer'));
    });
    await waitFor(() => {
      expect(selectCustomerSummaryStatus(view.store.getState(), 'second')).toBe('succeeded');
    });
    expect(selectCustomerSummary(view.store.getState(), 'second')?.fullName).toBe(
      'Second Customer',
    );

    view.rerender(
      <StrictMode>
        <CustomerSummarySync customerId="second" />
      </StrictMode>,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(view.store.getState().customerSummary).toEqual({
      customerId: null,
      data: null,
      status: 'idle',
    });
    view.store.dispatch(baseApi.util.resetApiState());
  });

  it('mirrors a transport failure for the active customer', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'Unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    const view = renderWithProviders(<CustomerSummarySync customerId="failed" />);

    await waitFor(() => {
      expect(selectCustomerSummaryStatus(view.store.getState(), 'failed')).toBe('failed');
    });
    expect(selectCustomerSummary(view.store.getState(), 'failed')).toBeNull();

    view.unmount();
    view.store.dispatch(baseApi.util.resetApiState());
  });

  it('returns the mirror to loading when the active query cache is reset', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    let requestCount = 0;
    let resolveRefetch: ((response: Response) => void) | undefined;
    const pendingRefetch = new Promise<Response>((resolve) => {
      resolveRefetch = resolve;
    });
    const fetchMock = vi.fn(async () => {
      requestCount += 1;
      return requestCount === 1 ? createResponse('Cached Customer') : pendingRefetch;
    });
    vi.stubGlobal('fetch', fetchMock);

    const view = renderWithProviders(<CustomerSummarySync customerId="reset" />);

    await waitFor(() => {
      expect(selectCustomerSummaryStatus(view.store.getState(), 'reset')).toBe('succeeded');
    });

    act(() => {
      view.store.dispatch(baseApi.util.resetApiState());
    });

    await waitFor(() => {
      expect(view.store.getState().customerSummary).toEqual({
        customerId: 'reset',
        data: null,
        status: 'loading',
      });
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    act(() => {
      resolveRefetch?.(createResponse('Refetched Customer'));
    });
    await waitFor(() => {
      expect(selectCustomerSummary(view.store.getState(), 'reset')?.fullName).toBe(
        'Refetched Customer',
      );
    });

    view.unmount();
    view.store.dispatch(baseApi.util.resetApiState());
  });

  it('lets a failed refetch override retained query data in the mirror', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    let requestCount = 0;
    const fetchMock = vi.fn(async () => {
      requestCount += 1;
      return requestCount === 1
        ? createResponse('Previously Loaded Customer')
        : new Response(JSON.stringify({ message: 'Unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
    });
    vi.stubGlobal('fetch', fetchMock);

    const view = renderWithProviders(<CustomerSummarySync customerId="refetch" />);

    await waitFor(() => {
      expect(selectCustomerSummaryStatus(view.store.getState(), 'refetch')).toBe('succeeded');
    });

    await act(async () => {
      await view.store.dispatch(
        customerSummaryApi.endpoints.getCustomerSummary.initiate('refetch', {
          forceRefetch: true,
          subscribe: false,
        }),
      );
    });

    await waitFor(() => {
      expect(selectCustomerSummaryStatus(view.store.getState(), 'refetch')).toBe('failed');
    });
    expect(selectCustomerSummary(view.store.getState(), 'refetch')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    view.unmount();
    view.store.dispatch(baseApi.util.resetApiState());
  });
});
