import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import {
  customerSummaryResponseFixture,
  stubCustomerSummaryFetch,
} from '@/test/customerDetails.fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerSummaryPanel } from './CustomerSummaryPanel';

const NativeRequest = globalThis.Request;
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

const fullName = customerSummaryResponseFixture.fullName as string;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomerSummaryPanel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pl');
  });

  it('renders the reference hierarchy with IWA status and the brand icon', async () => {
    stubCustomerSummaryFetch();
    const { container } = renderWithProviders(<CustomerSummaryPanel customerId="42" />);

    expect(await screen.findByRole('heading', { level: 2, name: fullName })).toBeInTheDocument();
    expect(screen.getByText(i18n.t('common.status.active'))).toBeInTheDocument();
    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText('31.08.2026')).toHaveAttribute('title', '31.08.2026');
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: i18n.t('customers.summaryPanel.column.identification'),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Rating' })).toBeInTheDocument();
    expect(screen.getAllByText('Rating')).toHaveLength(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('.pi-briefcase')).toBeInTheDocument();
  });

  it('formats the rating date with the active locale', async () => {
    await i18n.changeLanguage('en');
    stubCustomerSummaryFetch();
    renderWithProviders(<CustomerSummaryPanel customerId="42" />);

    const expectedDate = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2026-08-31T12:00:00'));
    expect(await screen.findByText(expectedDate)).toHaveAttribute('title', expectedDate);
  });

  it('keeps the header and every configured field visible as an en dash when values are empty', async () => {
    stubCustomerSummaryFetch({ fullName: '', grid: '', rating: null, status: null });
    renderWithProviders(<CustomerSummaryPanel customerId="42" />);

    const emptyValue = i18n.t('customers.value.notAvailable');
    const heading = await screen.findByRole('heading', { level: 2, name: emptyValue });
    expect(within(heading.parentElement ?? heading).getAllByText(emptyValue)).toHaveLength(2);
    expect(screen.getByText('GRID').closest('dl')).toHaveTextContent(emptyValue);
    const ratingSection = screen
      .getByRole('heading', { level: 3, name: 'Rating' })
      .closest('section');
    expect(ratingSection).toHaveTextContent(emptyValue);
  });

  it('never exposes a previous customer and uses reserved loading geometry instead', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    let resolveNewCustomer: ((response: Response) => void) | undefined;
    const pendingNewCustomer = new Promise<Response>((resolve) => {
      resolveNewCustomer = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const request = input instanceof NativeRequest ? input : new NativeRequest(input);
        const pathname = new URL(request.url).pathname;
        if (pathname.endsWith('/customers/old/summary')) {
          return new Response(JSON.stringify(customerSummaryResponseFixture), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return pendingNewCustomer;
      }),
    );

    const { container, rerender } = renderWithProviders(<CustomerSummaryPanel customerId="old" />);
    await screen.findByText(fullName);

    rerender(<CustomerSummaryPanel customerId="new" />);

    expect(
      screen.getByRole('status', { name: i18n.t('customers.summaryPanel.loading') }),
    ).toBeInTheDocument();
    expect(screen.queryByText(fullName)).not.toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('customers.summaryPanel.column.identification')),
    ).toBeInTheDocument();
    expect(container.querySelector('.pi-briefcase')).toBeInTheDocument();

    resolveNewCustomer?.(
      new Response(JSON.stringify(customerSummaryResponseFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('renders the stable empty panel after a failed request instead of an endless loading state', async () => {
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

    renderWithProviders(<CustomerSummaryPanel customerId="42" />);

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: i18n.t('customers.value.notAvailable'),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: i18n.t('customers.summaryPanel.loading') }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('GRID').closest('dl')).toHaveTextContent(
      i18n.t('customers.value.notAvailable'),
    );
  });
});
