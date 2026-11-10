import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { chooseDropdownOption } from '@/test/chooseDropdownOption';
import { SelectFilter } from './SelectFilter';
import type { TableFilterValues, TableFilterOption } from './TableFilters.types';

const options: readonly TableFilterOption[] = [
  { value: 'original', labelKey: 'facilities.currency.original' },
  { value: 'EUR', label: 'EUR' },
];
const appendToHead = document.head.appendChild.bind(document.head);
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
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
});

describe('SelectFilter', () => {
  it('selects one value, translates its summary and clears the selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledFilter />);
    const input = screen.getByLabelText('Currency', { selector: 'input' });
    await chooseDropdownOption(user, input, 'Original currency');
    expect(input).toHaveValue('Original currency');
    expect(screen.getByRole('status', { name: 'Filter summary' })).toHaveTextContent(
      'Original currency',
    );
    await chooseDropdownOption(user, input, 'EUR');
    expect(screen.getByRole('status', { name: 'Filter summary' })).toHaveTextContent(/^EUR$/);
    await user.click(screen.getByLabelText('Clear'));
    expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Filter summary' })).toBeEmptyDOMElement();
  });
});
