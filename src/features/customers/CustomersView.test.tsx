import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigationType } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore, type AppStore } from '@/app/store';
import { seedCustomerPreviewData } from '@/dev/previewData/customers.preview';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import { createUrlState } from '@/features/urlState/urlState.slice';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth, paginatorControl } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';
import { customersApi } from './customers.api';
import { selectCustomerQuery } from './customers.filters';

const appendToHead = document.head.appendChild.bind(document.head);

function LocationProbe() {
  const { search } = useLocation();
  return (
    <output aria-label="Current customer URL" data-navigation-type={useNavigationType()}>
      {search}
    </output>
  );
}

function renderPage(initialEntry = '/customers/all', store?: AppStore) {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
      <LocationProbe />
    </>,
    { initialEntries: [initialEntry], store },
  );
}

beforeEach(async () => {
  // Wide enough for the nine leading columns (name … lending rating); the TS
  // date and status, the identifiers and the advisors stay in the accordion.
  mockTableContainerWidth(1380);
  installCustomerApiTestTransport();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomersView', () => {
  it('renders the customer view from the typed Polish catalog', async () => {
    await i18n.changeLanguage('pl');
    renderPage();

    expect(screen.getByRole('heading', { name: 'Klienci oraz ich doradcy' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'Nazwa klienta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dostosuj filtry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ustawienia listy' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Szukaj na liście')).toBeInTheDocument();
    expect(await screen.findAllByText('Przekroczona')).toHaveLength(2);
  });

  it('renders the development preview cache without an HTTP request', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const store = makeStore({ urlState: createUrlState('/customers/all') });
    seedCustomerPreviewData(store);

    renderPage('/customers/all', store);

    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    expect(screen.getByText('15 results')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the deep-link query for the first and only initial RTK Query request', async () => {
    const { store } = renderPage('/customers/all?q=carrefour&status=ACTIVE&pageSize=10');

    expect(screen.getByPlaceholderText('Search the list')).toHaveValue('carrefour');
    expect(await screen.findByText('CARREFOUR POLAND SP. Z O.O.')).toBeInTheDocument();
    expect(screen.getByText('1 results')).toBeInTheDocument();

    await waitFor(() => {
      const query = selectCustomerQuery(store.getState());
      expect(query).toMatchObject({ q: 'carrefour', pageSize: 10 });
      expect(query.filters.status).toEqual(['ACTIVE']);
      expect(customersApi.endpoints.getCustomers.select(query)(store.getState()).status).toBe(
        'fulfilled',
      );
      expect(Object.keys(store.getState().api.queries)).toHaveLength(1);
    });
  });

  it('keeps deep-linked filters working while the filter button stays inert', async () => {
    const user = userEvent.setup();
    const { store } = renderPage('/customers/all?status=ARCHIVAL');

    expect(await screen.findByText('OZAROW CEMENT S.A.')).toBeInTheDocument();
    expect(screen.getByText('4 results')).toBeInTheDocument();

    await waitFor(() => {
      expect(selectCustomerQuery(store.getState()).filters.status).toEqual(['ARCHIVAL']);
    });

    await user.click(screen.getByRole('button', { name: 'Customize filters' }));

    const search = screen.getByRole('status', { name: 'Current customer URL' }).textContent ?? '';
    expect(search).toBe('?status=ARCHIVAL');
    expect(selectCustomerQuery(store.getState()).filters.status).toEqual(['ARCHIVAL']);
  });

  it('narrows the table to the typed search, back on page 1, without a history entry', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all?page=2&sort=fullName&status=ACTIVE');
    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search the list'), 'carrefour');

    // The search starts 300 ms after the last keystroke, then waits for the response.
    expect(await screen.findByText('1 results', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText('ARCELORMITTAL WARSAW SP. Z O.O.')).not.toBeInTheDocument();
    const location = screen.getByRole('status', { name: 'Current customer URL' });
    const search = new URLSearchParams(location.textContent ?? '');
    expect(search.get('q')).toBe('carrefour');
    expect(search.has('page')).toBe(false);
    expect(search.get('sort')).toBe('fullName');
    expect(search.get('status')).toBe('ACTIVE');
    expect(location).toHaveAttribute('data-navigation-type', 'REPLACE');
  });

  it('links each customer name to its details page in a new tab', async () => {
    renderPage();

    const nameLink = await screen.findByRole('link', {
      name: 'ARCELORMITTAL WARSAW SP. Z O.O.',
    });
    expect(nameLink).toHaveAttribute('href', '/customers/23997');
    expect(nameLink).toHaveAttribute('target', '_blank');
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

    await user.click(screen.getByRole('columnheader', { name: /customer name/i }));
    await waitFor(() => {
      const search = screen.getByRole('status', { name: 'Current customer URL' }).textContent ?? '';
      expect(new URLSearchParams(search).get('dir')).toBe('desc');
    });

    await user.click(paginatorControl('next'));
    await waitFor(() => {
      const search = screen.getByRole('status', { name: 'Current customer URL' }).textContent ?? '';
      expect(new URLSearchParams(search).get('page')).toBe('2');
    });
  });

  it('flags the overdue review dates of a customer', async () => {
    renderPage();

    expect(await screen.findAllByText('Overdue')).toHaveLength(2);
  });

  it('expands every visible customer through the toolbar control', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    const expandAll = screen.getByRole('switch', { name: 'Expand all' });
    await user.click(expandAll);

    expect(expandAll).toBeChecked();
    expect(screen.getAllByRole('region', { name: /collapse details for/i })).toHaveLength(10);
    expect(screen.getByText('Drewniak Dariusz')).toBeInTheDocument();
  });
});
