import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MultiSelect } from 'primereact/multiselect';
import { expect, it, vi } from 'vitest';
import { tableFilter } from './tableFilter';
import { TableFilterDialog } from './TableFilterDialog';
import type { FilterableTableField, TableFilterProps } from './TableFilters.types';

// The IWA multiselect is a PrimeReact multiselect; its option list opens on the document
// body and listens to the scrolling of the field's containers.
function PrimeFilter({ inputId }: TableFilterProps) {
  return (
    <MultiSelect
      unstyled
      inputId={inputId}
      value={[]}
      options={[{ label: 'Active', value: 'ACTIVE' }]}
      onChange={vi.fn()}
    />
  );
}
PrimeFilter.useSummary = () => '';

const fields: readonly FilterableTableField[] = [
  {
    field: 'status',
    labelKey: 'customers.table.field.status',
    filter: tableFilter(PrimeFilter, {}),
  },
];

it('closes an open option list when its container scrolls', async () => {
  render(<TableFilterDialog fields={fields} values={{}} onSave={vi.fn()} onCancel={vi.fn()} />);

  const field = screen.getByRole('combobox').closest('[data-pc-name="multiselect"]');
  if (field === null) throw new Error('The multiselect did not render.');
  fireEvent.click(field);
  // The list counts as hidden while its opening transition runs.
  expect(await screen.findByRole('listbox', { hidden: true })).toBeInTheDocument();

  // The library listens to every scrolling container of the field once the list has opened.
  // jsdom computes no stylesheet, so the rows area does not count as one here and the window
  // stands in for it; the scroll repeats until the list has finished opening.
  await waitFor(() => {
    fireEvent.scroll(window);
    expect(screen.queryByRole('listbox', { hidden: true })).not.toBeInTheDocument();
  });
});
