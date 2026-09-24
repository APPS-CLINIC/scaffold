import { StrictMode } from 'react';
import { act, render, waitFor, type RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PrimeReactProvider } from 'primereact/api';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore, type AppStore } from '@/app/store';
import { baseApi } from '@/api/baseApi';
import {
  customerAdvisorsResponseFixture,
  customerDetailsResponseFixture,
  customerSummaryResponseFixture,
} from '@/test/customerDetails.fixtures';
import i18n from '@/i18n';
import { customersDetailRoutes } from '@/routes/pageRoutes/customers.pageRoutes';
import { customerSummaryApi } from './customerSummary.api';
import type { CustomerSummaryResponse } from './customerSummary.types';

const NativeRequest = globalThis.Request;
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

function createCustomerTestRoutes(): RouteObject[] {
  return [{ path: '/customers', children: [...customersDetailRoutes] }];
}

function createSummaryResponse(customerId: string, fullName: string): Response {
  const body: CustomerSummaryResponse = {
    ...customerSummaryResponseFixture,
    fullName,
    grid: `GRID-${customerId}`,
    corporateGroupName: null,
    corporateGroupGrid: null,
    internalGroupName: null,
    pamLam: null,
    homeCountry: null,
    segmentColor: null,
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

/** Every path this suite hits that is not deliberately overridden by a test's own `fetchImpl`. */
function defaultFetch(pathname: string): Response {
  if (pathname.endsWith('/advisors')) {
    return new Response(JSON.stringify(customerAdvisorsResponseFixture), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (pathname.endsWith('/summary')) {
    const customerId = pathname.split('/').at(-2) ?? 'unknown';
    const label = customerId.charAt(0).toUpperCase() + customerId.slice(1);
    return createSummaryResponse(customerId, `${label} Customer`);
  }
  if (pathname.endsWith('/customers/first') || pathname.endsWith('/customers/second')) {
    return new Response(JSON.stringify(customerDetailsResponseFixture), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface RenderCustomerRoutesResult {
  store: AppStore;
  router: ReturnType<typeof createMemoryRouter>;
  view: RenderResult;
  requestedPaths: string[];
  summaryRequestCount: () => number;
}

/** Mounts the real customer route tree behind a stubbed transport and tracks every request path. */
function renderCustomerRoutes(
  fetchImpl: (pathname: string) => Promise<Response> | Response = defaultFetch,
  initialEntry = '/customers/first',
): RenderCustomerRoutesResult {
  vi.stubGlobal('Request', AbsoluteTestRequest);
  const requestedPaths: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const request = input instanceof NativeRequest ? input : new NativeRequest(input);
    const pathname = new URL(request.url).pathname;
    requestedPaths.push(pathname);
    return fetchImpl(pathname);
  });
  vi.stubGlobal('fetch', fetchMock);

  const store = makeStore();
  const router = createMemoryRouter(createCustomerTestRoutes(), {
    initialEntries: [initialEntry],
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

  return {
    store,
    router,
    view,
    requestedPaths,
    summaryRequestCount: () => requestedPaths.filter((path) => path.endsWith('/summary')).length,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomerDetailLayout routing lifecycle', () => {
  it('redirects to the configured default and keeps one summary request across every tab', async () => {
    const { store, view, router, requestedPaths, summaryRequestCount } = renderCustomerRoutes();

    await waitFor(() => {
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select('first')(store.getState()).status,
      ).toBe('fulfilled');
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/customers/first/general-data');
    });
    expect(
      view.getByRole('heading', { level: 1, name: i18n.t('customers.details.pageTitle') }),
    ).toBeInTheDocument();
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.generalData') }),
    ).toBeInTheDocument();
    expect(view.getAllByText('First Customer').length).toBeGreaterThan(0);
    expect(view.container.querySelector('.pi-briefcase')).toBeInTheDocument();
    expect(summaryRequestCount()).toBe(1);
    expect(requestedPaths.filter((path) => path.endsWith('/customers/first'))).toHaveLength(1);
    expect(
      requestedPaths.filter((path) => path.endsWith('/customers/first/advisors')),
    ).toHaveLength(1);

    await act(async () => {
      await router.navigate('/customers/first/cdd-crs-fatca');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.cddCrsFatca') }),
    ).toBeInTheDocument();
    expect(
      view.getByRole('heading', {
        level: 4,
        name: i18n.t('customers.details.compliance.subsection.scopeFileData'),
      }),
    ).toBeInTheDocument();
    expect(requestedPaths.filter((path) => path.endsWith('/customers/first'))).toHaveLength(1);
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate('/customers/first/dashboard');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.dashboard') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).not.toBeInTheDocument();
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate('/customers/first/dashboard/future-section');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.dashboard') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).not.toBeInTheDocument();
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate('/customers/first/general-data');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.generalData') }),
    ).toBeInTheDocument();
    const persistentSummaryIcon = view.container.querySelector('.pi-briefcase');
    expect(persistentSummaryIcon).toBeInTheDocument();
    expect(requestedPaths.filter((path) => path.endsWith('/customers/first'))).toHaveLength(1);
    expect(
      requestedPaths.filter((path) => path.endsWith('/customers/first/advisors')),
    ).toHaveLength(1);
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate('/customers/first/general-data/future-section');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.generalData') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate('/customers/first/fm-data');
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/customers/first/fm-data/basic-data');
    });
    expect(
      view.getByRole('heading', {
        level: 4,
        name: i18n.t('customers.details.fmData.section.cpac'),
      }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(requestedPaths.filter((path) => path.endsWith('/customers/first'))).toHaveLength(1);
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate('/customers/first/fm-data/mandates');
    });
    expect(
      view.getByRole('heading', {
        level: 3,
        name: i18n.t('customers.details.fmData.part.mandates'),
      }),
    ).toBeInTheDocument();
    expect(
      view.queryByRole('heading', {
        level: 4,
        name: i18n.t('customers.details.fmData.section.cpac'),
      }),
    ).not.toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);

    await act(async () => {
      await router.navigate('/customers/first/reviews');
    });
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.reviews') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(summaryRequestCount()).toBe(1);

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
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate(-1);
    });
    expect(router.state.location.pathname).toBe('/customers/first/reviews');
    expect(
      view.getByRole('heading', { level: 2, name: i18n.t('nav.customerDetail.reviews') }),
    ).toBeInTheDocument();
    expect(view.container.querySelector('.pi-briefcase')).toBe(persistentSummaryIcon);
    expect(summaryRequestCount()).toBe(1);

    view.unmount();
    store.dispatch(baseApi.util.resetApiState());
  });

  it('never exposes a previous customer when switching and evicts before the new request resolves', async () => {
    let resolveSecondCustomer: ((response: Response) => void) | undefined;
    const pendingSecondCustomer = new Promise<Response>((resolve) => {
      resolveSecondCustomer = resolve;
    });
    const { store, view, router, summaryRequestCount } = renderCustomerRoutes((pathname) =>
      pathname.endsWith('/customers/second/summary')
        ? pendingSecondCustomer
        : defaultFetch(pathname),
    );

    await waitFor(() => {
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select('first')(store.getState()).status,
      ).toBe('fulfilled');
    });
    expect(view.getAllByText('First Customer').length).toBeGreaterThan(0);
    expect(summaryRequestCount()).toBe(1);

    await act(async () => {
      await router.navigate('/customers/second/general-data');
    });

    expect(
      view.getByRole('status', { name: i18n.t('customers.summaryPanel.loading') }),
    ).toBeInTheDocument();
    expect(view.queryByText('First Customer')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(summaryRequestCount()).toBe(2);
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
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select('second')(store.getState()).status,
      ).toBe('fulfilled');
    });
    expect(view.getAllByText('Second Customer').length).toBeGreaterThan(0);
    expect(summaryRequestCount()).toBe(2);

    view.unmount();
    store.dispatch(baseApi.util.resetApiState());
  });

  it('retries the summary request when a new tab subscribes after a rejected request', async () => {
    let summaryAttempts = 0;
    // Holds the first response open until the panel (a second, independently-mounted subscriber
    // to the same cache entry, one lazy layout below the layout anchor) has joined it. Otherwise
    // the panel's own mount is a real race against the reject settling and can itself count as
    // the "new subscriber" that retries — before the deliberate tab switch below ever runs.
    let resolveFirstSummary: ((response: Response) => void) | undefined;
    const pendingFirstSummary = new Promise<Response>((resolve) => {
      resolveFirstSummary = resolve;
    });
    const { store, view, router, summaryRequestCount } = renderCustomerRoutes((pathname) => {
      if (!pathname.endsWith('/summary')) return defaultFetch(pathname);
      summaryAttempts += 1;
      if (summaryAttempts === 1) return pendingFirstSummary;
      return createSummaryResponse('first', 'First Customer');
    });

    await waitFor(() => {
      expect(
        view.getByRole('status', { name: i18n.t('customers.summaryPanel.loading') }),
      ).toBeInTheDocument();
    });
    expect(summaryRequestCount()).toBe(1);

    act(() => {
      resolveFirstSummary?.(
        new Response(JSON.stringify({ message: 'Unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    await waitFor(() => {
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select('first')(store.getState()).status,
      ).toBe('rejected');
    });
    expect(summaryRequestCount()).toBe(1);
    expect(view.queryByText('First Customer')).not.toBeInTheDocument();

    // CustomerCddCrsFatcaView is a fresh subscriber to the same cache entry: RTK Query retries a
    // rejected (never-fulfilled) query for any new subscriber, so switching tabs is enough.
    await act(async () => {
      await router.navigate('/customers/first/cdd-crs-fatca');
    });

    await waitFor(() => {
      expect(summaryRequestCount()).toBe(2);
    });
    await waitFor(() => {
      expect(
        customerSummaryApi.endpoints.getCustomerSummary.select('first')(store.getState()).status,
      ).toBe('fulfilled');
    });
    expect(view.getAllByText('First Customer').length).toBeGreaterThan(0);

    view.unmount();
    store.dispatch(baseApi.util.resetApiState());
  });
});
