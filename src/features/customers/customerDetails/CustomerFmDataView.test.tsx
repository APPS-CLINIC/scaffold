import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerFmDataView } from './CustomerFmDataView';
import { CUSTOMER_FM_DATA_PARTS, type CustomerFmDataPart } from './customerFmData.parts';

const basicData = CUSTOMER_FM_DATA_PARTS[0];
const mandates = CUSTOMER_FM_DATA_PARTS[1];

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
    const onSelectPart = renderView(basicData);

    await user.click(menu().getByText('Mandates'));

    expect(onSelectPart).toHaveBeenCalledWith(mandates);
    expect(screen.getByRole('heading', { name: 'Basic data' })).toBeInTheDocument();
  });

  it('stays quiet when the active part is picked again', async () => {
    const user = userEvent.setup();
    const onSelectPart = renderView(basicData);

    await user.click(menu().getByText('Basic data'));

    expect(onSelectPart).not.toHaveBeenCalled();
  });
});
