import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import i18n from '@/i18n';
import {
  customerDetailsResponseFixture,
  customerSummaryResponseFixture,
} from '@/test/customerDetails.fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerReviewsView } from './CustomerReviewsView';
import { mapCustomerDetailsResponse } from './customerDetails.adapter';
import { customerDetailsApi } from './customerDetails.api';
import type { CustomerDetailsResponse } from './customerDetails.types';
import { CUSTOMER_REVIEWS_PARTS, type CustomerReviewsPart } from './customerReviews.parts';
import { mapCustomerSummaryResponse } from './customerSummary.adapter';
import { customerSummaryApi } from './customerSummary.api';

const reviewDates = CUSTOMER_REVIEWS_PARTS[0];
const facilities = CUSTOMER_REVIEWS_PARTS[1];
const collaterals = CUSTOMER_REVIEWS_PARTS[2];

/** The part menu, scoped so a tab is never confused with the heading of the shown part. */
function menu() {
  return within(screen.getByRole('navigation', { name: 'Review parts' }));
}

function renderView(part: CustomerReviewsPart, onSelectPart = vi.fn()) {
  renderWithProviders(
    <CustomerReviewsView customerId="23997" part={part} onSelectPart={onSelectPart} />,
  );

  return onSelectPart;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CustomerReviewsView', () => {
  it('names the section and its part menu for assistive technology', () => {
    renderView(facilities);

    const section = screen.getByRole('group', { name: 'Customer reviews' });
    expect(within(section).getByRole('navigation', { name: 'Review parts' })).toBeInTheDocument();
  });

  it('offers every configured part and titles the one the URL selected', () => {
    renderView(facilities);

    for (const label of ['Review dates', 'Facilities', 'Collateral']) {
      expect(menu().getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { level: 3, name: 'Facilities' })).toBeInTheDocument();
    expect(screen.getByText(i18n.t('section.placeholder'))).toBeInTheDocument();
  });

  it('reports the picked part instead of switching on its own', async () => {
    const user = userEvent.setup();
    const onSelectPart = renderView(facilities);

    await user.click(menu().getByText('Collateral'));

    expect(onSelectPart).toHaveBeenCalledWith(collaterals);
    expect(screen.getByRole('heading', { level: 3, name: 'Facilities' })).toBeInTheDocument();
  });

  it('stays quiet when the active part is picked again', async () => {
    const user = userEvent.setup();
    const onSelectPart = renderView(facilities);

    await user.click(menu().getByText('Facilities'));

    expect(onSelectPart).not.toHaveBeenCalled();
  });
});

describe('Review dates', () => {
  function renderReviewDates(overrides: Partial<CustomerDetailsResponse> = {}) {
    const customerId = '23997';
    const store = makeStore();
    store.dispatch(
      customerDetailsApi.util.upsertQueryEntries([
        {
          endpointName: 'getCustomerDetails',
          arg: customerId,
          value: mapCustomerDetailsResponse({ ...customerDetailsResponseFixture, ...overrides }),
        },
      ]),
    );
    store.dispatch(
      customerSummaryApi.util.upsertQueryEntries([
        {
          endpointName: 'getCustomerSummary',
          arg: customerId,
          value: mapCustomerSummaryResponse({
            ...customerSummaryResponseFixture,
            cddExpirationDate: '2020-01-01',
          }),
        },
      ]),
    );

    renderWithProviders(
      <CustomerReviewsView customerId={customerId} part={reviewDates} onSelectPart={vi.fn()} />,
      { store },
    );
  }

  /** The label/value row for a label. */
  function row(label: string) {
    const term = screen.getByText(label).closest('dl');
    if (!term) throw new Error(`Expected a row labelled ${label}.`);
    return term;
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-24T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the dates in the order and the two groups of the design', () => {
    renderReviewDates();

    expect(screen.getByRole('heading', { level: 3, name: 'Review dates' })).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((term) => term.textContent?.replace(/:$/, ''))).toEqual([
      'Lending review date',
      'Review extension date',
      'Lending rating review date',
      'CDD expiration date',
      'FATCA review date',
      'TS pricing condition status',
      'TS pricing conditions end date',
    ]);
    const separators = document.querySelectorAll('hr');
    expect(separators).toHaveLength(1);
    expect(separators[0]?.parentElement).toHaveTextContent('TS pricing condition status');
    expect(separators[0]?.parentElement).not.toHaveTextContent('FATCA review date');
  });

  it('formats every date and shows the TS status as the service sends it', () => {
    renderReviewDates();

    expect(row('Lending review date')).toHaveTextContent('11/30/2026');
    expect(row('Review extension date')).toHaveTextContent('12/15/2026');
    expect(row('Lending rating review date')).toHaveTextContent('10/15/2026');
    expect(row('TS pricing condition status')).toHaveTextContent('STANDARD_CONTRACT_END_DATE');
    expect(row('TS pricing conditions end date')).toHaveTextContent('12/31/2026');
  });

  it('takes the CDD expiration date from the customer details', () => {
    renderReviewDates();

    expect(row('CDD expiration date')).toHaveTextContent('03/31/2027');
    expect(row('CDD expiration date')).not.toHaveTextContent('01/01/2020');
  });

  it('marks every past date with how many days it is overdue, above the date', async () => {
    await i18n.changeLanguage('pl');
    renderReviewDates({
      basicData: {
        ...(customerDetailsResponseFixture.basicData as Record<string, unknown>),
        reviewExtensionDate: '2026-09-22',
      },
      lending: { lendingReviewDate: '2026-05-27', lendingRatingReviewDate: '2026-09-23' },
      cdd: { cddRiskLevel: 'Low', cddExpirationDate: '2026-09-19' },
      tsPrice: {
        tsPriceConditionStatus: 'STANDARD_CONTRACT_END_DATE',
        tsPriceConditionEndDate: '2026-09-02',
      },
    });

    const expected: Record<string, string> = {
      'Data przeglądu kredytowego': 'Zaległe 120 dni',
      'Data review extension': 'Zaległe 2 dni',
      'Data przeglądu ratingu kredytowego': 'Zaległy 1 dzień',
      'Data wygaśnięcia CDD': 'Zaległe 5 dni',
      'Data przeglądu FATCA': 'Zaległe 24 dni',
      'Data końcowa warunków cenowych TS': 'Zaległe 22 dni',
    };
    for (const [label, marker] of Object.entries(expected)) {
      const markerText = within(row(label)).getByText(marker);
      const date = row(label).querySelector('time');
      expect(date).not.toBeNull();
      expect(markerText.compareDocumentPosition(date as Node)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }
    expect(screen.queryByText(i18n.t('customers.details.compliance.status.overdue'))).toBeNull();
  });

  it('leaves today and future dates unmarked', async () => {
    await i18n.changeLanguage('pl');
    renderReviewDates({
      lending: { lendingReviewDate: '2026-09-24', lendingRatingReviewDate: '2026-09-25' },
    });

    expect(row('Data przeglądu kredytowego')).not.toHaveTextContent('Zaległ');
    expect(row('Data przeglądu ratingu kredytowego')).not.toHaveTextContent('Zaległ');
    expect(screen.getAllByText(/^Zaległ/)).toHaveLength(1);
  });

  it('shows an en dash where the service sends no value', () => {
    renderReviewDates({
      tsPrice: { tsPriceConditionStatus: null, tsPriceConditionEndDate: null },
      lending: null,
    });

    for (const label of [
      'Lending review date',
      'Lending rating review date',
      'TS pricing condition status',
      'TS pricing conditions end date',
    ]) {
      expect(row(label)).toHaveTextContent('–');
    }
  });

  it('offers no filters, only the refresh', async () => {
    await i18n.changeLanguage('pl');
    renderReviewDates();

    for (const chip of ['Wszystkie', 'Do 30 dni', 'Powyżej 30 dni', 'Zaległe']) {
      expect(screen.queryByText(chip)).toBeNull();
    }
    expect(screen.getByText('Stan na:')).toBeInTheDocument();
    expect(screen.getByText('Odśwież')).toBeInTheDocument();
  });
});

describe('Review dates over the network', () => {
  const NativeRequest = globalThis.Request;

  class AbsoluteTestRequest extends NativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      const requestInit = init ? { ...init, signal: undefined } : undefined;
      super(typeof input === 'string' ? new URL(input, 'https://app.test') : input, requestInit);
    }
  }

  function stubDetailsFetch(respond: () => Promise<Response>): string[] {
    const requestedPaths: string[] = [];
    vi.stubGlobal('Request', AbsoluteTestRequest);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const request = input instanceof NativeRequest ? input : new NativeRequest(input);
        requestedPaths.push(new URL(request.url).pathname);
        return respond();
      }),
    );

    return requestedPaths;
  }

  const detailsResponse = () =>
    new Response(JSON.stringify(customerDetailsResponseFixture), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the rows while the details load and fills them when they arrive', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    stubDetailsFetch(async () => {
      await pending;
      return detailsResponse();
    });

    renderView(reviewDates);

    const part = screen.getByText('Lending review date').closest('[aria-busy]');
    expect(part).toHaveAttribute('aria-busy', 'true');
    release?.();
    await waitFor(() => expect(part).not.toHaveAttribute('aria-busy'));
    expect(screen.getByText('Lending review date').closest('dl')).toHaveTextContent('11/30/2026');
  });

  it('announces a failed request and keeps every row empty', async () => {
    stubDetailsFetch(
      async () =>
        new Response(JSON.stringify({ message: 'Unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
    );

    renderView(reviewDates);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Detailed customer data could not be loaded.',
    );
    expect(screen.getByText('FATCA review date').closest('dl')).toHaveTextContent('–');
  });

  it('asks for the customer details again on refresh', async () => {
    const user = userEvent.setup();
    const requestedPaths = stubDetailsFetch(async () => detailsResponse());

    renderView(reviewDates);
    await waitFor(() =>
      expect(screen.getByText('Lending review date').closest('dl')).toHaveTextContent('11/30/2026'),
    );
    await user.click(screen.getByText('Refresh'));

    await waitFor(() => expect(requestedPaths).toHaveLength(2));
    expect(requestedPaths.every((path) => path.endsWith('/customers/23997'))).toBe(true);
  });
});
