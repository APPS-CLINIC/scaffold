import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
import type { SelectProps } from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { TableColumnOption } from '../GenericDataTable.types';
import { SortableColumnRow, type SortableColumnRowProps } from './SortableColumnRow';

// `sortOptions` and the option order are props the double does not surface, so the
// Select is replaced with one that exposes them; everything else stays the double.
vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  Select: ({ options = [], value, onChange, sortOptions, errorMessage }: SelectProps) => (
    <div>
      <select
        data-testid="select"
        data-sort-options={String(sortOptions)}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value || null)}
      >
        <option value="" />
        {options.map((option) =>
          typeof option === 'string' ? (
            <option key={option} value={option}>
              {option}
            </option>
          ) : (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ),
        )}
      </select>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  ),
}));

interface Row {
  id: number;
  name: string;
  status: string;
  grid: string;
}

const options: readonly TableColumnOption<Row>[] = [
  { field: 'name', labelKey: 'customers.table.field.fullName' },
  { field: 'status', labelKey: 'customers.table.field.status' },
  { field: 'grid', labelKey: 'customers.table.field.grid' },
];

const addedRow = { key: 7, field: 'status' as const, added: true };

function renderRow(props: Partial<SortableColumnRowProps<Row>> = {}) {
  const onFieldChange = vi.fn();
  const onRemove = vi.fn();
  const row = props.row ?? { key: 7, field: 'status' as const, added: false };

  render(
    <DndContext>
      <SortableContext items={[row.key]}>
        <ol>
          <SortableColumnRow
            row={row}
            position={2}
            options={options}
            invalid={false}
            removable
            onFieldChange={onFieldChange}
            onRemove={onRemove}
            {...props}
          />
        </ol>
      </SortableContext>
    </DndContext>,
  );

  return { onFieldChange, onRemove };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('SortableColumnRow', () => {
  it('names the drag handle and the remove control by position', () => {
    renderRow();

    expect(screen.getByRole('button', { name: 'Move column 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove column 2' })).toBeEnabled();
  });

  it('shows a column already in use by its name, without a Select', () => {
    renderRow();

    expect(screen.getByRole('listitem')).toHaveTextContent('Status');
    expect(screen.queryByTestId('select')).not.toBeInTheDocument();
  });

  it('hands the Select of an added row the options in the given order, unsorted', () => {
    renderRow({ row: addedRow });

    const select = screen.getByTestId('select');
    expect(select).toHaveAttribute('data-sort-options', 'false');
    expect(select).toHaveValue('status');
    expect(
      screen
        .getAllByRole('option')
        .map((option) => option.textContent)
        .filter(Boolean),
    ).toEqual(['Customer name', 'Status', 'GRID']);
  });

  it('reports the chosen field, or null when the choice is cleared', async () => {
    const user = userEvent.setup();
    const { onFieldChange } = renderRow({ row: addedRow });

    await user.selectOptions(screen.getByTestId('select'), 'grid');
    expect(onFieldChange).toHaveBeenLastCalledWith('grid');

    await user.selectOptions(screen.getByTestId('select'), '');
    expect(onFieldChange).toHaveBeenLastCalledWith(null);
  });

  it('calls onRemove from the remove control', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();

    await user.click(screen.getByRole('button', { name: 'Remove column 2' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('disables the remove control when the row is not removable', () => {
    renderRow({ removable: false });

    expect(screen.getByRole('button', { name: 'Remove column 2' })).toBeDisabled();
  });

  it('shows the validation message only while invalid', () => {
    renderRow({ invalid: true, row: { key: 9, field: null, added: true } });

    expect(screen.getByText('Fill in or remove the column')).toBeInTheDocument();
  });

  it('shows no validation message while valid', () => {
    renderRow({ row: addedRow });

    expect(screen.queryByText('Fill in or remove the column')).not.toBeInTheDocument();
  });
});
