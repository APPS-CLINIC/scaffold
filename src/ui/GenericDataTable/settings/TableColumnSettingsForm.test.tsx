import type * as DndKitCore from '@dnd-kit/core';
import type { DndContextProps } from '@dnd-kit/core';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
import type { DialogProps } from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { TableColumnOption } from '../GenericDataTable.types';
import { TableColumnSettingsForm } from './TableColumnSettingsForm';

// The drag-and-drop callbacks and announcements are props handed to the library, not
// something jsdom can drive with real pointer geometry, so the context is replaced with
// one that captures them; the rows still render through the real sortable hooks.
const dndProps: { current: DndContextProps | null } = { current: null };

vi.mock('@dnd-kit/core', async (importOriginal) => ({
  ...(await importOriginal<typeof DndKitCore>()),
  DndContext: (props: DndContextProps) => {
    dndProps.current = props;
    return <>{props.children}</>;
  },
}));

// The library types the visibility setter as a state setter, so the fake closes with
// a function updater to prove both forms of the contract are honoured.
vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  Dialog: ({ headingProps, visibility, onSetVisibility, children }: DialogProps) =>
    visibility ? (
      <section aria-label={headingProps?.text}>
        <button type="button" onClick={() => onSetVisibility((current) => !current)}>
          Close {headingProps?.text}
        </button>
        {children}
      </section>
    ) : null,
}));

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

function renderForm() {
  const onCancel = vi.fn();
  render(
    <TableColumnSettingsForm
      fields={fields}
      columns={['grid', 'name', 'status']}
      onSave={vi.fn()}
      onCancel={onCancel}
      onRestoreDefaults={vi.fn()}
    />,
  );

  return { onCancel };
}

const selectValues = () =>
  screen.getAllByRole('combobox').map((select) => (select as HTMLSelectElement).value);

function captured(): DndContextProps {
  if (dndProps.current === null) throw new Error('DndContext did not render.');

  return dndProps.current;
}

function dragEnd(activeId: number, overId: number | null) {
  const event = {
    active: { id: activeId },
    over: overId === null ? null : { id: overId },
  } as unknown as DndKitCore.DragEndEvent;
  act(() => captured().onDragEnd?.(event));
}

beforeEach(async () => {
  dndProps.current = null;
  await i18n.changeLanguage('en');
});

describe('TableColumnSettingsForm drag and drop', () => {
  it('moves the dragged row to the position of the row it was dropped over', () => {
    renderForm();

    // Ids are row keys: grid is 0, name is 1, status is 2.
    dragEnd(0, 2);
    expect(selectValues()).toEqual(['name', 'status', 'grid']);

    dragEnd(0, 1);
    expect(selectValues()).toEqual(['grid', 'name', 'status']);
  });

  it('leaves the order alone when the drop has no target or targets itself', () => {
    renderForm();

    dragEnd(1, null);
    dragEnd(1, 1);

    expect(selectValues()).toEqual(['grid', 'name', 'status']);
  });

  it('announces every step of a move in the active language', () => {
    renderForm();
    const announcements = captured().accessibility?.announcements;
    expect(captured().accessibility?.screenReaderInstructions?.draggable).toBe(
      'Press space to pick up a column, arrow keys to move it, and space to drop it.',
    );
    if (!announcements) throw new Error('No announcements were configured.');
    const active = { id: 0 } as DndKitCore.Active;
    const over = { id: 2 } as DndKitCore.Over;

    expect(announcements.onDragStart({ active })).toBe(
      'Picked up column GRID from position 1 of 3',
    );
    expect(announcements.onDragOver({ active, over })).toBe('Column GRID is at position 3 of 3');
    expect(announcements.onDragEnd({ active, over })).toBe(
      'Column GRID dropped at position 3 of 3',
    );
    expect(announcements.onDragEnd({ active, over: null })).toBe(
      'Column GRID dropped at position 1 of 3',
    );
    expect(announcements.onDragCancel({ active, over: null })).toBe('Moving column GRID cancelled');
  });

  it('announces nothing for an id that is not a row', () => {
    renderForm();
    const announcements = captured().accessibility?.announcements;
    if (!announcements) throw new Error('No announcements were configured.');
    const active = { id: 99 } as DndKitCore.Active;

    expect(announcements.onDragStart({ active })).toBeUndefined();
    expect(announcements.onDragOver({ active, over: null })).toBeUndefined();
    expect(announcements.onDragEnd({ active, over: null })).toBeUndefined();
    expect(announcements.onDragCancel({ active, over: null })).toBeUndefined();
  });
});

describe('TableColumnSettingsForm dialog visibility', () => {
  it('treats a function updater that resolves to hidden as a cancel', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Close List settings' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('resolves a function updater for the confirm dialog too', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Restore defaults' }));
    expect(screen.getByRole('region', { name: 'Restoring default settings' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close Restoring default settings' }));

    expect(
      screen.queryByRole('region', { name: 'Restoring default settings' }),
    ).not.toBeInTheDocument();
  });
});
