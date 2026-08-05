import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomersView } from './CustomersView';
import { customersApi } from './customers.api';
import { selectCustomerQuery } from './customers.filters';

const appendToHead = document.head.appendChild.bind(document.head);

function LocationProbe() {
  const { search } = useLocation();
  return <output aria-label="Current customer URL">{search}</output>;
}

function renderPage(initialEntry = '/clients/all') {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
      <LocationProbe />
    </>,
    { initialEntries: [initialEntry] },
  );
}

beforeEach(async () => {
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  await i18n.changeLanguage('en');
});

describe('CustomersView', () => {
  it('renders the customer view from the typed Polish catalog', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('pl');
    renderPage();

    expect(screen.getByRole('heading', { name: 'Klienci oraz ich doradcy' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: /nazwa klienta/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dostosuj filtry' }));
    expect(screen.getByRole('combobox', { name: 'Status klienta' })).toBeInTheDocument();
  });

  it('uses the deep-link query for the first and only initial RTK Query request', async () => {
    const { store } = renderPage('/clients/all?q=carrefour&filter.status=active&pageSize=10');

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('carrefour');
    expect(screen.getByRole('combobox', { name: 'Customer status' })).toHaveValue('active');
    expect(await screen.findByText('CARREFOUR POLAND SP. Z O.O.')).toBeInTheDocument();
    expect(screen.getByText('1 results')).toBeInTheDocument();

    await waitFor(() => {
      const query = selectCustomerQuery(store.getState());
      expect(customersApi.endpoints.getCustomers.select(query)(store.getState()).status).toBe(
        'fulfilled',
      );
      expect(Object.keys(store.getState().api.queries)).toHaveLength(1);
    });
  });

  it('stores a selected filter in the URL, resets the page, and refreshes Redux data', async () => {
    const user = userEvent.setup();
    renderPage('/clients/all?page=2');

    await user.click(screen.getByRole('button', { name: 'Customize filters' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Customer status' }), 'inactive');

    await waitFor(() => {
      const search = screen.getByRole('status', { name: 'Current customer URL' }).textContent ?? '';
      const params = new URLSearchParams(search);
      expect(params.get('filter.status')).toBe('inactive');
      expect(params.has('page')).toBe(false);
    });

    expect(await screen.findByText('OZAROW CEMENT S.A.')).toBeInTheDocument();
    expect(screen.getByText('4 results')).toBeInTheDocument();
  });

  it('writes table sorting and pagination back to the URL', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(screen.getByRole('columnheader', { name: /customer name/i }));
    await waitFor(() => {
      const search = screen.getByRole('status', { name: 'Current customer URL' }).textContent ?? '';
      expect(new URLSearchParams(search).get('sort')).toBe('fullName');
    });

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => {
      const search = screen.getByRole('status', { name: 'Current customer URL' }).textContent ?? '';
      expect(new URLSearchParams(search).get('page')).toBe('2');
    });
  });

  it('expands every visible customer through the toolbar control', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    const expandAll = screen.getByRole('checkbox', { name: 'Expand all' });
    await user.click(expandAll);

    expect(expandAll).toBeChecked();
    expect(screen.getAllByRole('region', { name: /collapse details for/i })).toHaveLength(10);
    expect(screen.getByText('Drewniak Dariusz')).toBeInTheDocument();
  });
});
