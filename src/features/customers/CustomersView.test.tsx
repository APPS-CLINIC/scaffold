import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore, type AppStore } from '@/app/store';
import { seedCustomerPreviewData } from '@/dev/previewData/customers.preview';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import { createUrlState } from '@/features/urlState/urlState.slice';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';
import { customersApi } from './customers.api';
import { selectCustomerQuery } from './customers.filters';

const appendToHead = document.head.appendChild.bind(document.head);

function LocationProbe() {
  const { search } = useLocation();
  return <output aria-label="Current customer URL">{search}</output>;
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
  // Wide enough for the nine reference columns; identifiers and advisors
  // stay in the accordion, mirroring the desktop reference layout.
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
    expect(await screen.findByRole('columnheader', { name: /nazwa klienta/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dostosuj filtry' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Szukaj na liście')).not.toBeInTheDocument();
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
    const { store } = renderPage('/customers/all?q=carrefour&filter.status=active&pageSize=10');

    expect(screen.queryByRole('textbox', { name: 'Search' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Customer status' })).not.toBeInTheDocument();
    expect(await screen.findByText('CARREFOUR POLAND SP. Z O.O.')).toBeInTheDocument();
    expect(screen.getByText('1 results')).toBeInTheDocument();

    await waitFor(() => {
      const query = selectCustomerQuery(store.getState());
      expect(query).toMatchObject({ q: 'carrefour', status: 'active', pageSize: 10 });
      expect(customersApi.endpoints.getCustomers.select(query)(store.getState()).status).toBe(
        'fulfilled',
      );
      expect(Object.keys(store.getState().api.queries)).toHaveLength(1);
    });
  });

  it('keeps deferred filters wired through deep links without rendering their controls', async () => {
    const { store } = renderPage('/customers/all?filter.status=archival');

    expect(await screen.findByText('OZAROW CEMENT S.A.')).toBeInTheDocument();
    expect(screen.getByText('4 results')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customize filters' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Customer status' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(selectCustomerQuery(store.getState()).status).toBe('archival');
    });
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
