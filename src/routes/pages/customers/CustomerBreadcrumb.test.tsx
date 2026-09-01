import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerBreadcrumb } from './CustomerBreadcrumb';

function LocationProbe() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe('CustomerBreadcrumb', () => {
  it('renders real links for the full configured and future L3+ hierarchy', () => {
    renderWithProviders(<CustomerBreadcrumb customerId="42" customerName="Acme" />, {
      initialEntries: ['/customers/42/reviews/details/record-7'],
    });

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toHaveClass('flex-nowrap', 'overflow-x-auto', 'whitespace-nowrap');
    const links = within(breadcrumb).getAllByRole('link');

    expect(links.map((link) => link.textContent)).toEqual([
      i18n.t('nav.customers.all'),
      'Acme',
      i18n.t('nav.customerDetail.reviews'),
      i18n.t('nav.customerDetail.reviewDetails'),
      'Record 7',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/customers/all',
      '/customers/42',
      '/customers/42/reviews',
      '/customers/42/reviews/details',
      '/customers/42/reviews/details/record-7',
    ]);
  });

  it('uses client-side navigation while retaining the target href', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CustomerBreadcrumb customerId="42" customerName="Acme" />
        <LocationProbe />
      </>,
      { initialEntries: ['/customers/42/reviews/details'] },
    );

    const reviewsLink = screen.getByRole('link', {
      name: i18n.t('nav.customerDetail.reviews'),
    });
    expect(reviewsLink).toHaveAttribute('href', '/customers/42/reviews');

    await user.click(reviewsLink);
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/42/reviews');
  });

  it('shows only the list and customer levels on L1', () => {
    renderWithProviders(<CustomerBreadcrumb customerId="42" customerName={null} />, {
      initialEntries: ['/customers/42'],
    });

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      i18n.t('nav.customers.all'),
      '42',
    ]);
  });
});
