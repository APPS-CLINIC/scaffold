import { StrictMode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PrimeReactProvider } from 'primereact/api';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { baseApi } from '@/api/baseApi';
import i18n from '@/i18n';
import { customersDetailRoutes } from '@/routes/pageRoutes/customers.pageRoutes';
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

function createSummaryResponse(customerId: string, fullName: string): Response {
  const body: CustomerSummaryResponse = {
    fullName,
    grid: `GRID-${customerId}`,
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

function createCustomerTestRoutes(): RouteObject[] {
  return [
    {
      path: '/customers',
      children: customersDetailRoutes.map(({ path, lazy, children }) => ({
        path,
        lazy,
        children: children ? [...children] : undefined,
      })),
    },
  ];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomerDetailLayout routing lifecycle', () => {
  it('redirects L1 to the configured default and keeps one request across navigation', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    let resolveSecondCustomer: ((response: Response) => void) | undefined;
    const pendingSecondCustomer = new Promise<Response>((resolve) => {
      resolveSecondCustomer = resolve;
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const request = input instanceof NativeRequest ? input : new NativeRequest(input);
      const pathname = new URL(request.url).pathname;

      if (pathname.endsWith('/customers/second/summary')) return pendingSecondCustomer;
      if (pathname.endsWith('/customers/first/summary')) {
        return createSummaryResponse('first', 'First Customer');
      }

      return new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = makeStore();
    const router = createMemoryRouter(createCustomerTestRoutes(), {
      initialEntries: ['/customers/first'],
    });
    const view = render(
      <StrictMode>
        <PrimeReactProvider>
          <Provider store={store}>
            <RouterProvider router={router} />
          </Provider>
        </PrimeReactProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(selectCustomerSummaryStatus(store.getState(), 'first')).toBe('succeeded');
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/customers/first/general-data');
    });
    expect(selectCustomerSummary(store.getState(), 'first')?.fullName).toBe('First Customer');
    expect(
      view.getByRole('heading', { level: 1, name: i18n.t('customers.details.pageTitle') }),
    ).toBeInTheDocument();
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.generalData') }),
    ).toBeInTheDocument();
    expect(view.getAllByText('First Customer').length).toBeGreaterThan(0);
    expect(view.container.querySelector('.pi-briefcase')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await router.navigate('/customers/first/dashboard');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.dashboard') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await router.navigate('/customers/first/dashboard/future-section');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.dashboard') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await router.navigate('/customers/first/general-data');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.generalData') }),
    ).toBeInTheDocument();
    const persistentSummaryIcon = view.container.querySelector('.pi-briefcase');
    expect(persistentSummaryIcon).toBeInTheDocument();

    await act(async () => {
      await router.navigate('/customers/first/general-data/future-section');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.generalData') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await router.navigate('/customers/first/reviews');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.reviews') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await router.navigate('/customers/first/reviews/details');
    });
    expect(
      view.getByRole('heading', {
        level: 2,
        name: i18n.t('nav.customerDetail.reviewDetails'),
      }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await router.navigate(-1);
    });
    expect(router.state.location.pathname).toBe('/customers/first/reviews');
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.reviews') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await router.navigate('/customers/second/general-data');
    });
    expect(store.getState().customerSummary).toEqual({
      customerId: 'second',
      data: null,
      status: 'loading',
    });
    expect(selectCustomerSummary(store.getState(), 'first')).toBeNull();
    expect(view.queryByText('First Customer')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select('first')(store.getState()).status,
      ).toBe('uninitialized');
    });

    act(() => {
      resolveSecondCustomer?.(createSummaryResponse('second', 'Second Customer'));
    });
    await waitFor(() => {
      expect(selectCustomerSummaryStatus(store.getState(), 'second')).toBe('succeeded');
    });
    expect(selectCustomerSummary(store.getState(), 'second')?.fullName).toBe('Second Customer');
    expect(view.getAllByText('Second Customer').length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    view.unmount();
    store.dispatch(baseApi.util.resetApiState());
  });
});
