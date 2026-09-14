import type * as DndKitCore from '@dnd-kit/core';
import type { DndContextProps } from '@dnd-kit/core';
import type { ComponentProps } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
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

// The dialog frame is a set of props handed to the library, so the fake records them per
// heading. It closes with a function updater to prove both forms of the setter contract are
// honoured. The button fake exposes its style props as data attributes.
// The library types `children` on the component, not on its exported props interface.
type DialogComponentProps = ComponentProps<typeof IwaComponents.CustomizableDialog>;
type ButtonComponentProps = ComponentProps<typeof IwaComponents.Button>;

const dialogProps: { current: Record<string, DialogComponentProps> } = { current: {} };

vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  CustomizableDialog: (props: DialogComponentProps) => {
    const { headingProps, visibility, onSetVisibility, children } = props;
    if (headingProps?.text) dialogProps.current[headingProps.text] = props;

    return visibility ? (
      <section aria-label={headingProps?.text}>
        <button type="button" onClick={() => onSetVisibility((current) => !current)}>
          Close {headingProps?.text}
        </button>
        {children}
      </section>
    ) : null;
  },
  Button: ({ label, style, size, className, onClick }: ButtonComponentProps) => (
    <button
      type="button"
      data-style={style}
      data-size={size}
      className={className}
      onClick={() => void onClick?.()}
    >
      {label}
    </button>
  ),
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

const rowNames = () => screen.getAllByRole('listitem').map((row) => row.textContent);

function captured(): DndContextProps {
  if (dndProps.current === null) throw new Error('DndContext did not render.');

  return dndProps.current;
}

function dialog(heading: string): DialogComponentProps {
  const props = dialogProps.current[heading];
  if (props === undefined) throw new Error(`Dialog "${heading}" did not render.`);

  return props;
}

const classesOf = (className: string | undefined) => className?.split(' ') ?? [];

function footerButtons(heading: string): HTMLElement[] {
  return within(screen.getByRole('region', { name: heading }))
    .getAllByRole('button')
    .filter((button) => button.dataset.style !== undefined);
}

const describeButtons = (buttons: HTMLElement[]) =>
  buttons.map((button) => [button.textContent, button.dataset.style, button.dataset.size]);

function dragEnd(activeId: number, overId: number | null) {
  const event = {
    active: { id: activeId },
    over: overId === null ? null : { id: overId },
  } as unknown as DndKitCore.DragEndEvent;
  act(() => captured().onDragEnd?.(event));
}

beforeEach(async () => {
  dndProps.current = null;
  dialogProps.current = {};
  await i18n.changeLanguage('en');
});

describe('TableColumnSettingsForm drag and drop', () => {
  it('moves the dragged row to the position of the row it was dropped over', () => {
    renderForm();

    // Ids are row keys: grid is 0, name is 1, status is 2.
    dragEnd(0, 2);
    expect(rowNames()).toEqual(['Customer name', 'Status', 'GRID']);

    dragEnd(0, 1);
    expect(rowNames()).toEqual(['GRID', 'Customer name', 'Status']);
  });

  it('leaves the order alone when the drop has no target or targets itself', () => {
    renderForm();

    dragEnd(1, null);
    dragEnd(1, 1);

    expect(rowNames()).toEqual(['GRID', 'Customer name', 'Status']);
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

describe('TableColumnSettingsForm dialog layout', () => {
  it('gives the settings dialog a fixed 600 by 835 frame capped by the viewport', () => {
    renderForm();

    const settings = dialog('List settings');
    expect(settings.headingProps).toMatchObject({ centered: true });
    expect(classesOf(settings.className)).toEqual(
      expect.arrayContaining([
        '!w-[600px]',
        '!max-w-[calc(100vw-2rem)]',
        '!h-[835px]',
        '!max-h-[calc(100vh-2rem)]',
      ]),
    );
  });

  it('drops the content padding so the tab line and the footer separator span the dialog', () => {
    renderForm();

    expect(classesOf(dialog('List settings').contentClassName)).toContain('!p-0');
    // The fake renders children straight into the region, which stands in for the content.
    const region = screen.getByRole('region', { name: 'List settings' });
    const tabRow = within(region).getByText('Customize columns').parentElement;
    expect(tabRow).toHaveClass('border-b', 'px-6');
    expect(tabRow?.parentElement).toBe(region);
    const footer = footerButtons('List settings')[0]?.parentElement;
    expect(footer).toHaveClass('border-t', 'px-6');
    expect(footer?.parentElement).toBe(region);
  });

  it('puts restore on the left of cancel and save in the footer', () => {
    renderForm();

    const footer = footerButtons('List settings');
    expect(describeButtons(footer)).toEqual([
      ['Restore defaults', 'text', 'medium'],
      ['Cancel', 'outline', 'medium'],
      ['Save', 'filled', 'medium'],
    ]);
    expect(footer[0]).toHaveClass('mr-auto');
  });

  it('gives the confirmation a 420 wide frame of at least 296 with stretched buttons', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Restore defaults' }));

    const confirm = dialog('Restoring default settings');
    expect(classesOf(confirm.className)).toEqual(
      expect.arrayContaining(['!w-[420px]', '!max-w-[calc(100vw-2rem)]', '!min-h-[296px]']),
    );
    expect(classesOf(confirm.contentClassName)).toContain('!p-0');
    const buttons = footerButtons('Restoring default settings');
    expect(describeButtons(buttons)).toEqual([
      ['Restore defaults', 'filled', 'medium'],
      ['Back to settings', 'outline', 'medium'],
    ]);
    expect(buttons.every((button) => button.classList.contains('w-full'))).toBe(true);
    expect(buttons[0]?.parentElement).toHaveClass('border-t', 'flex-col');
    expect(buttons[0]?.parentElement?.parentElement).toBe(
      screen.getByRole('region', { name: 'Restoring default settings' }),
    );
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
