import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerDetailHeading } from './CustomerDetailHeading';

function LocationProbe() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe('CustomerDetailHeading', () => {
  it('renders the IWA page heading with only the configured customer-list return link', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CustomerDetailHeading />
        <LocationProbe />
      </>,
      { initialEntries: ['/customers/42/reviews/record-7'] },
    );

    expect(
      screen.getByRole('heading', { level: 1, name: i18n.t('customers.details.pageTitle') }),
    ).toBeInTheDocument();

    expect(screen.getAllByRole('link')).toHaveLength(1);
    const backLink = screen.getByRole('link', {
      name: i18n.t('customers.details.backToList'),
    });
    expect(backLink).toHaveAttribute('href', '/customers/all');
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t('nav.customerDetail.reviews'))).not.toBeInTheDocument();

    await user.click(backLink);
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/all');
  });
});
