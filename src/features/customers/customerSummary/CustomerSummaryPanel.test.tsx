import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerSummaryPanel } from './CustomerSummaryPanel';
import type { CustomerSummary } from './customerSummary.types';

const summary: CustomerSummary = {
  fullName: 'ACME Corporation',
  grid: 'PL12345678',
  corporateGroupName: null,
  corporateGroupGrid: 'PL87654321',
  internalGroupName: 'ACME Group',
  pamLam: 'PAM',
  homeCountry: 'Poland',
  segmentColor: 'Orange',
  rating: 'AAA',
  status: 'ACTIVE',
  kkf: null,
  pamName: 'John Doe',
  lendingRatingDate: '2026-08-31',
  cddRiskLevel: null,
  cddExpirationDate: null,
};

describe('CustomerSummaryPanel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pl');
  });

  it('renders the reference hierarchy with IWA status and the brand icon', () => {
    const { container } = renderWithProviders(<CustomerSummaryPanel customerId="42" />, {
      preloadedState: {
        customerSummary: { customerId: '42', data: summary, status: 'succeeded' },
      },
    });

    const customerHeading = screen.getByRole('heading', {
      level: 2,
      name: 'ACME Corporation',
    });
    expect(customerHeading.parentElement).toHaveClass('flex-col', 'items-start');
    expect(
      screen.getByText(i18n.t('common.status.active')).closest('.min-h-7'),
    ).toBeInTheDocument();
    expect(screen.getByText('AAA').parentElement).not.toHaveClass('rounded-full');
    expect(screen.getByText('31.08.2026')).toHaveAttribute('title', '31.08.2026');
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: i18n.t('customers.summaryPanel.column.identification'),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Rating' })).toBeInTheDocument();
    expect(screen.getAllByText('Rating')).toHaveLength(1);
    expect(screen.getByText('ACME Group').closest('a')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    const icon = container.querySelector('.pi-briefcase');
    expect(icon?.parentElement).toHaveClass(
      'size-24',
      'bg-[var(--navigation-accent)]',
      'text-white',
    );
    expect(icon?.parentElement?.className).toContain('[&_.pi]:text-4xl');
    expect(container.querySelector('.pi-cog')).not.toBeInTheDocument();
  });

  it('formats the rating date with the active locale', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<CustomerSummaryPanel customerId="42" />, {
      preloadedState: {
        customerSummary: { customerId: '42', data: summary, status: 'succeeded' },
      },
    });

    const expectedDate = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2026-08-31T12:00:00'));
    expect(screen.getByText(expectedDate)).toHaveAttribute('title', expectedDate);
  });

  it('keeps the header and every configured field visible as an en dash when values are empty', () => {
    const emptySummary: CustomerSummary = {
      ...summary,
      fullName: '',
      grid: '',
      rating: null,
      status: null,
    };
    renderWithProviders(<CustomerSummaryPanel customerId="42" />, {
      preloadedState: {
        customerSummary: { customerId: '42', data: emptySummary, status: 'succeeded' },
      },
    });

    const emptyValue = i18n.t('customers.value.notAvailable');
    const heading = screen.getByRole('heading', { level: 2, name: emptyValue });
    expect(within(heading.parentElement ?? heading).getAllByText(emptyValue)).toHaveLength(2);
    expect(screen.getByText('GRID').closest('dl')).toHaveTextContent(emptyValue);
    const ratingSection = screen
      .getByRole('heading', { level: 3, name: 'Rating' })
      .closest('section');
    expect(ratingSection).toHaveTextContent(emptyValue);
  });

  it('never exposes a previous customer and uses reserved loading geometry instead', () => {
    const { container } = renderWithProviders(<CustomerSummaryPanel customerId="new" />, {
      preloadedState: {
        customerSummary: { customerId: 'old', data: summary, status: 'succeeded' },
      },
    });

    expect(
      screen.getByRole('status', { name: i18n.t('customers.summaryPanel.loading') }),
    ).toBeInTheDocument();
    expect(screen.queryByText('ACME Corporation')).not.toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('customers.summaryPanel.column.identification')),
    ).toBeInTheDocument();
    expect(container.querySelector('.size-24.rounded-full')).toBeInTheDocument();
  });

  it('renders the stable empty panel after a failed request instead of an endless loading state', () => {
    renderWithProviders(<CustomerSummaryPanel customerId="42" />, {
      preloadedState: {
        customerSummary: { customerId: '42', data: null, status: 'failed' },
      },
    });

    expect(
      screen.queryByRole('status', { name: i18n.t('customers.summaryPanel.loading') }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: i18n.t('customers.value.notAvailable'),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('GRID').closest('dl')).toHaveTextContent(
      i18n.t('customers.value.notAvailable'),
    );
  });
});
