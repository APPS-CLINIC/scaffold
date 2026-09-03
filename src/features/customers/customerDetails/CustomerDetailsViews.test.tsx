import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import {
  customerAdvisorsResponseFixture,
  customerDetailsResponseFixture,
  stubCustomerSummaryFetch,
} from '@/test/customerDetails.fixtures';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerCddCrsFatcaView } from './CustomerCddCrsFatcaView';
import { CustomerGeneralDataView } from './CustomerGeneralDataView';
import {
  EMPTY_CUSTOMER_ADVISORS,
  EMPTY_CUSTOMER_DETAILS,
  mapCustomerAdvisorsResponse,
  mapCustomerDetailsResponse,
} from './customerDetails.adapter';
import { customerDetailsApi } from './customerDetails.api';

const NativeRequest = globalThis.Request;
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

function seedDetails(store: ReturnType<typeof makeStore>, customerId = '23997') {
  store.dispatch(
    customerDetailsApi.util.upsertQueryEntries([
      {
        endpointName: 'getCustomerDetails',
        arg: customerId,
        value: mapCustomerDetailsResponse(customerDetailsResponseFixture),
      },
      {
        endpointName: 'getCustomerAdvisors',
        arg: customerId,
        value: mapCustomerAdvisorsResponse(customerAdvisorsResponseFixture),
      },
    ]),
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('customer detail views', () => {
  it('renders the complete configured General data hierarchy and localized values', () => {
    const store = makeStore();
    seedDetails(store);

    renderWithProviders(<CustomerGeneralDataView customerId="23997" />, { store });

    expect(screen.getByRole('heading', { name: 'Basic data' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Addresses' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Advisors' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Consents' })).toBeInTheDocument();
    expect(screen.getByText('5250000000')).toBeInTheDocument();
    expect(screen.getAllByText('06/12/2014').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Main Street 123, 00-001 Warsaw')).toHaveLength(2);
    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No').length).toBeGreaterThan(0);
  });

  it('keeps every General data row visible as an en dash for null values', () => {
    const store = makeStore();
    store.dispatch(
      customerDetailsApi.util.upsertQueryEntries([
        {
          endpointName: 'getCustomerDetails',
          arg: 'empty',
          value: EMPTY_CUSTOMER_DETAILS,
        },
        {
          endpointName: 'getCustomerAdvisors',
          arg: 'empty',
          value: EMPTY_CUSTOMER_ADVISORS,
        },
      ]),
    );

    renderWithProviders(<CustomerGeneralDataView customerId="empty" />, { store });

    expect(screen.getByText('Tax ID').closest('dl')).toHaveTextContent('–');
    expect(screen.getByText('Address').closest('dl')).toHaveTextContent('–');
    expect(screen.getByText('RM advisor').closest('dl')).toHaveTextContent('–');
    expect(screen.getByText('ING electronic marketing').closest('dl')).toHaveTextContent('–');
  });

  it('reserves the configured layout while both General data requests load', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    let releaseRequests: (() => void) | undefined;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequests = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        await requestGate;
        const request = input instanceof NativeRequest ? input : new NativeRequest(input);
        const body = new URL(request.url).pathname.endsWith('/advisors')
          ? customerAdvisorsResponseFixture
          : customerDetailsResponseFixture;
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    renderWithProviders(<CustomerGeneralDataView customerId="loading" />);

    const region = screen.getByLabelText('Customer general data');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Tax ID')).toBeInTheDocument();
    expect(screen.getByText('Customer Service advisor')).toBeInTheDocument();

    releaseRequests?.();
    await waitFor(() => expect(region).not.toHaveAttribute('aria-busy'));
  });

  it('announces a transport error while preserving the complete empty layout', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (): Promise<Response> =>
          new Response(JSON.stringify({ message: 'Unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    renderWithProviders(<CustomerGeneralDataView customerId="failed" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Detailed customer data could not be loaded.',
    );
    expect(screen.getByText('Tax ID').closest('dl')).toHaveTextContent('–');
    expect(screen.getByText('Customer Service advisor').closest('dl')).toHaveTextContent('–');
  });

  it('uses the summary endpoint for CDD and the detail endpoint for CRS/FATCA', async () => {
    stubCustomerSummaryFetch({ cddRiskLevel: 'Low from summary', cddExpirationDate: '2000-01-02' });
    const store = makeStore();
    seedDetails(store);

    renderWithProviders(<CustomerCddCrsFatcaView customerId="23997" />, { store });

    expect(await screen.findByText('Low from summary')).toBeInTheDocument();
    const cddSection = screen.getByRole('heading', { name: 'CDD' }).closest('section');
    if (!cddSection) throw new Error('Expected a CDD section');
    expect(within(cddSection).getByText('Overdue')).toBeInTheDocument();
    expect(within(cddSection).getByText('01/02/2000')).toHaveAttribute('datetime', '2000-01-02');
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getAllByText('Completed')).toHaveLength(2);
    expect(screen.getByText('Periodic')).toBeInTheDocument();
    // Both design groups live inside the single CDD card, separated by one divider.
    expect(
      within(cddSection).getByRole('heading', { level: 4, name: 'Data ICBS' }),
    ).toBeInTheDocument();
    expect(
      within(cddSection).getByRole('heading', { level: 4, name: 'Scope file data' }),
    ).toBeInTheDocument();
    expect(cddSection.querySelectorAll('hr')).toHaveLength(1);
    expect(screen.getByText('Approval date').closest('dl')).toHaveTextContent('–');
    expect(screen.getByText('First pre - exit letter').closest('dl')).toHaveTextContent('–');
    expect(screen.getByText('Second pre - exit letter').closest('dl')).toHaveTextContent('–');
    expect(screen.getByText('Sprint start date').closest('dl')).toHaveTextContent('–');
  });
});
