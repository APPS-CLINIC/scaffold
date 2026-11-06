import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SelectFilter } from './SelectFilter';
import type { TableFilterValues, TableFilterOption } from './TableFilters.types';

const options: readonly TableFilterOption[] = [
  { value: 'original', labelKey: 'facilities.currency.original' },
  { value: 'EUR', label: 'EUR' },
];
function ControlledFilter() {
  const [values, setValues] = useState<TableFilterValues>({ currency: [] });
  const summary = SelectFilter.useSummary(values, { param: 'currency', options });
  return (
    <>
      <label id="currency-label" htmlFor="currency-input">
        Currency
      </label>
      <SelectFilter
        inputId="currency-input"
        labelId="currency-label"
        param="currency"
        values={values}
        onChange={setValues}
        options={options}
      />
      <output aria-label="Filter summary">{summary}</output>
    </>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('SelectFilter', () => {
  it('selects one value, translates its summary and clears the selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledFilter />);
    const input = screen.getByRole('combobox', { name: 'Currency' });
    await user.selectOptions(input, 'original');
    expect(input).toHaveValue('original');
    expect(screen.getByRole('status', { name: 'Filter summary' })).toHaveTextContent(
      'Original currency',
    );
    await user.selectOptions(input, 'EUR');
    expect(screen.getByRole('status', { name: 'Filter summary' })).toHaveTextContent(/^EUR$/);
    await user.selectOptions(input, '');
    expect(input).toHaveValue('');
    expect(screen.getByRole('status', { name: 'Filter summary' })).toBeEmptyDOMElement();
  });
});
