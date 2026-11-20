import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { createCustomerResponseFixture } from '@/dev/previewData/customers.fixture';
import { dictionariesApi } from '@/features/dictionaries';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { seedStaticDictionaries } from '@/test/customerFilterDictionaries.fixture';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mapCustomerResponse } from '../customers.adapter';
import type { CustomerResponse } from '../customers.types';
import { CustomerDictionaryCell, CustomerStatusCell } from './CustomerDictionaryCells';

let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

const customer = (overrides: Partial<CustomerResponse> = {}) =>
  mapCustomerResponse(createCustomerResponseFixture(1, 'ACME', overrides));

const cellProps = { locale: 'en', notAvailable: '–', rowIndex: 0 };

function renderTypeCell(type: string | null, store = makeStore()) {
  const row = customer({ type });
  return renderWithProviders(
    <CustomerDictionaryCell
      {...cellProps}
      dictionary="customer-type"
      row={row}
      field="type"
      value={row.type}
    />,
    { store },
  );
}

function renderStatusCell(store = makeStore()) {
  const row = customer({ status: 'ACTIVE' });
  return renderWithProviders(
    <CustomerStatusCell {...cellProps} row={row} field="status" value={row.status} />,
    { store },
  );
}

const failEveryRequest = () =>
  fetchMock.mockImplementation(
    async () => new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 }),
  );

beforeEach(async () => {
  fetchMock = installCustomerApiTestTransport();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomerDictionaryCell', () => {
  it('shows a code as the label its dictionary gives it', () => {
    const store = makeStore();
    seedStaticDictionaries(store);

    renderTypeCell('INVESTMENT_BANK', store);

    expect(screen.getByText('Investment bank')).toBeInTheDocument();
  });

  it('shows the TS status the list sends as a number by the label of its code', () => {
    const store = makeStore();
    seedStaticDictionaries(store);
    const row = customer({ tsPriceConditionStatus: 3 });

    renderWithProviders(
      <CustomerDictionaryCell
        {...cellProps}
        dictionary="ts-price-condition-status"
        row={row}
        field="tsPriceConditionStatus"
        value={row.tsPriceConditionStatus}
      />,
      { store },
    );

    expect(screen.getByText('3 - No contract end date, no terms')).toBeInTheDocument();
  });

  it('shows a value the dictionary does not know as the service sent it', () => {
    const store = makeStore();
    seedStaticDictionaries(store);

    renderTypeCell('Bank Inwestycyjny', store);

    expect(screen.getByText('Bank Inwestycyjny')).toBeInTheDocument();
  });

  it('holds a placeholder instead of the code until the dictionary loads', async () => {
    const { container } = renderTypeCell('INVESTMENT_BANK');

    expect(screen.queryByText('INVESTMENT_BANK')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(await screen.findByText('Investment bank')).toBeInTheDocument();
  });

  it('shows the code when the dictionary could not be loaded', async () => {
    failEveryRequest();

    renderTypeCell('INVESTMENT_BANK');

    expect(await screen.findByText('INVESTMENT_BANK')).toBeInTheDocument();
  });

  it('marks a row without a value as not available', () => {
    const store = makeStore();
    seedStaticDictionaries(store);

    renderTypeCell(null, store);

    expect(screen.getByText('–')).toBeInTheDocument();
  });
});

describe('CustomerStatusCell', () => {
  it('labels the status by the dictionary', () => {
    const store = makeStore();
    store.dispatch(
      dictionariesApi.util.upsertQueryEntries([
        {
          endpointName: 'getStaticDictionaries',
          arg: 'en',
          value: { 'customer-status': [{ code: 'ACTIVE', label: 'Active customer' }] },
        },
      ]),
    );

    renderStatusCell(store);

    expect(screen.getByText('Active customer')).toBeInTheDocument();
  });

  it('keeps the built-in label when the dictionary could not be loaded', async () => {
    failEveryRequest();

    renderStatusCell();

    expect(screen.getByText('Active')).toBeInTheDocument();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
