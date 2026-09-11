import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { TableColumnOption, TableColumnSettingsDialogProps } from '../GenericDataTable.types';
import { TableColumnSettingsDialog } from './TableColumnSettingsDialog';

interface Row {
  id: number;
  name: string;
  status: string;
  grid: string;
  note: string;
}

type Field = keyof Row;

const fields: readonly TableColumnOption<Row>[] = [
  { field: 'name', labelKey: 'customers.table.field.fullName' },
  { field: 'status', labelKey: 'customers.table.field.status' },
  { field: 'grid', labelKey: 'customers.table.field.grid' },
  { field: 'note', labelKey: 'customers.table.field.kkf' },
];

function renderDialog(props: Partial<TableColumnSettingsDialogProps<Row>> = {}) {
  const handlers = {
    onSave: vi.fn<(columns: readonly Field[]) => void>(),
    onCancel: vi.fn(),
    onRestoreDefaults: vi.fn(),
  };
  const columns: readonly Field[] = ['grid', 'name'];
  const view = render(
    <TableColumnSettingsDialog open fields={fields} columns={columns} {...handlers} {...props} />,
  );

  return { ...view, ...handlers };
}

const settingsDialog = () => screen.getByRole('dialog', { name: 'List settings' });
// dnd-kit renders its own announcement live region, so the counter is found by its text.
const counter = () => within(settingsDialog()).getByText(/^Used columns:/);
const selects = () => within(settingsDialog()).getAllByRole('combobox');
const selectValues = () => selects().map((select) => (select as HTMLSelectElement).value);
const optionLabels = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((option) => option.textContent)
    .filter(Boolean);

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('TableColumnSettingsDialog', () => {
  it('renders nothing while closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows one row per column, in order, with the tab, hint, title and counter', () => {
    renderDialog();

    const dialog = settingsDialog();
    expect(within(dialog).getByRole('button', { name: 'Customize columns' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      within(dialog).getByText(/Choose the fields to display from the data available/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: 'Customize column layout' }),
    ).toBeInTheDocument();
    expect(counter()).toHaveTextContent('Used columns: 2 of 4');
    expect(counter()).toHaveAttribute('role', 'status');
    expect(counter()).toHaveAttribute('aria-live', 'polite');
    expect(selectValues()).toEqual(['grid', 'name']);
    expect(within(dialog).getByRole('button', { name: 'Move column 1' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Move column 2' })).toBeInTheDocument();
  });

  it('offers each row the unused fields plus its own, in configuration order', () => {
    renderDialog();

    const [first, second] = selects();
    expect(first && optionLabels(first)).toEqual(['Status', 'GRID', 'KKF']);
    expect(second && optionLabels(second)).toEqual(['Customer name', 'Status', 'KKF']);
  });

  it('appends an empty row on Add column and disables it once every field is used', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Add column' }));
    expect(selectValues()).toEqual(['grid', 'name', '']);
    expect(counter()).toHaveTextContent('Used columns: 2 of 4');

    await user.click(screen.getByRole('button', { name: 'Add column' }));
    expect(selectValues()).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Add column' })).toBeDisabled();
  });

  it('removes a row and disables the remove control on the last one', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Remove column 1' }));

    expect(selectValues()).toEqual(['name']);
    expect(screen.getByRole('button', { name: 'Remove column 1' })).toBeDisabled();
  });

  it('marks an empty row on Save, keeps the dialog open and clears the mark once filled', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Add column' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(settingsDialog()).toBeInTheDocument();
    expect(screen.getByText('Fill in or remove the column')).toBeInTheDocument();

    const [, , empty] = selects();
    expect(empty).toBeDefined();
    if (empty) await user.selectOptions(empty, 'note');

    expect(screen.queryByText('Fill in or remove the column')).not.toBeInTheDocument();
  });

  it('hands the ordered columns to onSave once every row is filled', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Add column' }));
    const [, , empty] = selects();
    if (empty) await user.selectOptions(empty, 'status');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(['grid', 'name', 'status']);
  });

  it('discards the draft through Cancel and the close icon', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(within(settingsDialog()).getByRole('button', { name: 'Zamknij' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('asks for confirmation before restoring the defaults', async () => {
    const user = userEvent.setup();
    const { onRestoreDefaults } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Remove column 1' }));

    await user.click(screen.getByRole('button', { name: 'Restore defaults' }));
    const confirm = screen.getByRole('dialog', { name: 'Restoring default settings' });
    expect(
      within(confirm).getByText(
        'If you confirm, we will restore the default list settings for this search template',
      ),
    ).toBeInTheDocument();

    await user.click(within(confirm).getByRole('button', { name: 'Back to settings' }));
    expect(
      screen.queryByRole('dialog', { name: 'Restoring default settings' }),
    ).not.toBeInTheDocument();
    expect(onRestoreDefaults).not.toHaveBeenCalled();
    expect(selectValues()).toEqual(['name']);

    await user.click(screen.getByRole('button', { name: 'Restore defaults' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Restoring default settings' })).getByRole(
        'button',
        { name: 'Restore defaults' },
      ),
    );
    expect(onRestoreDefaults).toHaveBeenCalledTimes(1);
  });

  it('starts from the current columns on every opening, never from the abandoned draft', async () => {
    const user = userEvent.setup();
    const { rerender, onSave, onCancel, onRestoreDefaults } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Add column' }));
    expect(selectValues()).toHaveLength(3);

    const reopen = (open: boolean, columns: readonly Field[]) =>
      rerender(
        <TableColumnSettingsDialog
          open={open}
          fields={fields}
          columns={columns}
          onSave={onSave}
          onCancel={onCancel}
          onRestoreDefaults={onRestoreDefaults}
        />,
      );

    reopen(false, ['grid', 'name']);
    reopen(true, ['status']);

    expect(selectValues()).toEqual(['status']);
  });
});
