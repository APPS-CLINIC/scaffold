import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import i18n from '@/i18n';
import { customerDetailsResponseFixture } from '@/test/customerDetails.fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerFmDataView } from './CustomerFmDataView';
import { mapCustomerDetailsResponse } from './customerDetails.adapter';
import { customerDetailsApi } from './customerDetails.api';
import { CUSTOMER_FM_DATA_PARTS, type CustomerFmDataPart } from './customerFmData.parts';

const basicData = CUSTOMER_FM_DATA_PARTS[0];
const mandates = CUSTOMER_FM_DATA_PARTS[1];
const contracts = CUSTOMER_FM_DATA_PARTS[2];

/** The part menu, scoped so a tab is never confused with the heading of the shown part. */
function menu() {
  return within(screen.getByRole('navigation', { name: 'FM data parts' }));
}

function renderView(part: CustomerFmDataPart, onSelectPart = vi.fn()) {
  renderWithProviders(
    <CustomerFmDataView customerId="23997" part={part} onSelectPart={onSelectPart} />,
  );

  return onSelectPart;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CustomerFmDataView', () => {
  it('offers every configured part and shows the one the URL selected', () => {
    renderView(mandates);

    for (const label of ['Basic data', 'Mandates', 'Contracts', 'Proxies']) {
      expect(menu().getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: 'Mandates' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Basic data' })).not.toBeInTheDocument();
  });

  it('reports the picked part instead of switching on its own', async () => {
    const user = userEvent.setup();
    const onSelectPart = renderView(mandates);

    await user.click(menu().getByText('Contracts'));

    expect(onSelectPart).toHaveBeenCalledWith(contracts);
    expect(screen.getByRole('heading', { name: 'Mandates' })).toBeInTheDocument();
  });

  it('stays quiet when the active part is picked again', async () => {
    const user = userEvent.setup();
    const onSelectPart = renderView(mandates);

    await user.click(menu().getByText('Mandates'));

    expect(onSelectPart).not.toHaveBeenCalled();
  });
});

describe('FM basic data', () => {
  function renderBasicData(customerId = '23997') {
    const store = makeStore();
    store.dispatch(
      customerDetailsApi.util.upsertQueryEntries([
        {
          endpointName: 'getCustomerDetails',
          arg: customerId,
          value: mapCustomerDetailsResponse(customerDetailsResponseFixture),
        },
      ]),
    );

    renderWithProviders(
      <CustomerFmDataView customerId={customerId} part={basicData} onSelectPart={vi.fn()} />,
      { store },
    );
  }

  it('groups the FM fields as the design separates them', () => {
    renderBasicData();

    for (const heading of ['LEI', 'EMIR', 'CPAC', 'MIFID', 'MIFID suitability test result']) {
      expect(screen.getByRole('heading', { level: 4, name: heading })).toBeInTheDocument();
    }
    expect(document.querySelectorAll('hr')).toHaveLength(4);
  });

  it('formats every value the part shows', () => {
    renderBasicData();

    expect(screen.getByText('LEI code').closest('dl')).toHaveTextContent('5493001KJTIIGC8Y1R12');
    expect(screen.getByText('Validity date').closest('dl')).toHaveTextContent('12/31/2026');
    expect(screen.getByText('CPAC classification date').closest('dl')).toHaveTextContent(
      '02/22/2026',
    );
    expect(screen.getByText('MIFID suitability test date').closest('dl')).toHaveTextContent(
      '02/22/2026',
    );
    expect(
      screen.getByText('EMIR reporting on behalf of the customer').closest('dl'),
    ).toHaveTextContent('Yes');
    expect(screen.getByText('M07 – Mutual funds (TFI)').closest('dl')).toHaveTextContent('No');
    expect(screen.getByText('M10').closest('dl')).toHaveTextContent('–');
  });

  it('reports when the shown data was fetched and offers a refresh', () => {
    renderBasicData();

    expect(screen.getByText('As of:')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});
