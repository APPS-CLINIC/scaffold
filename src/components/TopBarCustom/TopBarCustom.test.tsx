import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TopBarCustom } from './TopBarCustom';

function LocationProbe() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function OpenCustomerList() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/customers/all')}>
      Open customer list
    </button>
  );
}

describe('TopBarCustom', () => {
  it('preserves the existing IWA top-bar presentation and utility actions', () => {
    const { container } = renderWithProviders(<TopBarCustom />, {
      initialEntries: ['/customers/42/general-data'],
    });

    expect(container.firstElementChild).toHaveClass('px-6', 'py-2');
    expect(
      screen.getByRole('button', { name: i18n.t('topbar.recentlyViewed') }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('topbar.quickSearch') })).toBeInTheDocument();
  });

  it.each([
    '/customers/42',
    '/customers/42/general-data',
    '/customers/42/reviews/details/record-7',
  ])('keeps the global Customers tab active for customer path %s', (pathname) => {
    renderWithProviders(
      <>
        <TopBarCustom />
        <LocationProbe />
      </>,
      { initialEntries: [pathname] },
    );

    expect(screen.getByRole('button', { name: i18n.t('nav.tab.customers') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: i18n.t('nav.tab.portfolio') })).toBeVisible();
    expect(
      screen.queryByRole('button', {
        name: i18n.t('nav.customerDetail.generalData'),
      }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: i18n.t('nav.customerDetail.cddCrsFatca'),
      }),
    ).toBeNull();
  });

  it('uses configured global destinations when leaving a customer deep link', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <TopBarCustom />
        <LocationProbe />
      </>,
      { initialEntries: ['/customers/42/reviews/details/record-7'] },
    );

    await user.click(screen.getByRole('button', { name: i18n.t('nav.tab.portfolio') }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/portfolio/dashboard');
  });

  it('keeps the same global tabs after returning from customer detail to L0', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <TopBarCustom />
        <OpenCustomerList />
      </>,
      { initialEntries: ['/customers/42'] },
    );

    const beforeLabels = screen
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('aria-selected'))
      .map((button) => button.textContent);
    await user.click(screen.getByRole('button', { name: 'Open customer list' }));

    expect(
      screen
        .getAllByRole('button')
        .filter((button) => button.hasAttribute('aria-selected'))
        .map((button) => button.textContent),
    ).toEqual(beforeLabels);
    expect(screen.getByRole('button', { name: i18n.t('nav.tab.customers') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('navigates a global tab to its configured default destination', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <TopBarCustom />
        <LocationProbe />
      </>,
      { initialEntries: ['/portfolio/dashboard'] },
    );

    await user.click(screen.getByRole('button', { name: i18n.t('nav.tab.customers') }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/all');
  });
});
