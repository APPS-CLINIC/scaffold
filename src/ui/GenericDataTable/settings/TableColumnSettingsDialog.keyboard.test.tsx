import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { TableColumnOption } from '../GenericDataTable.types';
import { TableColumnSettingsDialog } from './TableColumnSettingsDialog';

interface Row {
  id: number;
  name: string;
  status: string;
  grid: string;
}

const fields: readonly TableColumnOption<Row>[] = [
  { field: 'name', labelKey: 'customers.table.field.fullName' },
  { field: 'status', labelKey: 'customers.table.field.status' },
  { field: 'grid', labelKey: 'customers.table.field.grid' },
];

const ROW_HEIGHT = 40;

// jsdom has no layout: every rect is zero, so the keyboard sensor could never find a
// row below or above the active one. Each list item reports a rect from its index.
function stubListGeometry() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function getBoundingClientRect(this: HTMLElement): DOMRect {
      const item = this.closest('li');
      const index = item?.parentElement ? Array.from(item.parentElement.children).indexOf(item) : 0;
      const top = index * ROW_HEIGHT;

      return {
        x: 0,
        y: top,
        top,
        left: 0,
        width: 320,
        height: ROW_HEIGHT,
        right: 320,
        bottom: top + ROW_HEIGHT,
        toJSON: () => ({}),
      } as DOMRect;
    },
  );
}

function renderDialog() {
  render(
    <TableColumnSettingsDialog
      open
      fields={fields}
      columns={['grid', 'name', 'status']}
      onSave={vi.fn()}
      onCancel={vi.fn()}
      onRestoreDefaults={vi.fn()}
    />,
  );
}

const selectValues = () =>
  within(screen.getByRole('dialog', { name: 'List settings' }))
    .getAllByRole('combobox')
    .map((select) => (select as HTMLSelectElement).value);

beforeEach(async () => {
  stubListGeometry();
  await i18n.changeLanguage('en');
});

describe('TableColumnSettingsDialog keyboard reordering', () => {
  it('describes the handle with the localized instructions', () => {
    renderDialog();

    const handle = screen.getByRole('button', { name: 'Move column 1' });
    const instructionsId = handle.getAttribute('aria-describedby');
    expect(instructionsId).toBeTruthy();
    expect(document.getElementById(instructionsId ?? '')).toHaveTextContent(
      'Press space to pick up a column, arrow keys to move it, and space to drop it.',
    );
  });

  it('moves a row down with Space, ArrowDown, Space and announces each step', async () => {
    const user = userEvent.setup();
    renderDialog();

    screen.getByRole('button', { name: 'Move column 1' }).focus();
    // Picking up is announced, then immediately superseded by the position over itself.
    await user.keyboard('[Space]');
    expect(screen.getByText('Column GRID is at position 1 of 3')).toBeInTheDocument();
    await user.keyboard('[ArrowDown]');
    expect(screen.getByText('Column GRID is at position 2 of 3')).toBeInTheDocument();
    await user.keyboard('[Space]');

    expect(selectValues()).toEqual(['name', 'grid', 'status']);
    expect(screen.getByText('Column GRID dropped at position 2 of 3')).toBeInTheDocument();
  });

  it('keeps the order and announces the cancel on Escape', async () => {
    const user = userEvent.setup();
    renderDialog();

    screen.getByRole('button', { name: 'Move column 1' }).focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[Escape]');

    expect(selectValues()).toEqual(['grid', 'name', 'status']);
    expect(screen.getByText('Moving column GRID cancelled')).toBeInTheDocument();
  });
});
