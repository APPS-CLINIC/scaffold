import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { baseApi } from '@/api/baseApi';
import { customerSummaryResponseFixture } from '@/test/customerDetails.fixtures';
import { customerSummaryApi, getCustomerSummaryRequest } from './customerSummary.api';

const NativeRequest = globalThis.Request;
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

const response = customerSummaryResponseFixture;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('customer summary API contract', () => {
  it('builds the versioned endpoint and encodes the path parameter', () => {
    expect(getCustomerSummaryRequest('customer/42 #main')).toEqual({
      url: 'v1/customers/customer%2F42%20%23main/summary',
    });
  });

  it('requests the exact API path once and drops its cache after the last subscriber leaves', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL): Promise<Response> =>
        new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    const customerId = 'customer/42 #main';
    const subscription = store.dispatch(
      customerSummaryApi.endpoints.getCustomerSummary.initiate(customerId),
    );

    const result = await subscription.unwrap();
    const request = fetchMock.mock.calls[0]?.[0];

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(request).toBeInstanceOf(Request);
    if (!(request instanceof Request)) throw new Error('Expected fetch to receive a Request');
    expect(new URL(request.url).pathname).toBe('/api/v1/customers/customer%2F42%20%23main/summary');
    expect(result.fullName).toBe(response.fullName);
    expect(result.status).toBe('ACTIVE');

    subscription.unsubscribe();
    await vi.waitFor(() => {
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select(customerId)(store.getState()).status,
      ).toBe('uninitialized');
    });
    store.dispatch(baseApi.util.resetApiState());
  });
});
