import { useLayoutEffect, useReducer, useRef, useState, type SetStateAction } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Dialog } from 'iwa-react-components';
import { useTranslation } from 'react-i18next';
import type {
  GenericDataTableField,
  TableColumnSettingsDialogProps,
} from '../GenericDataTable.types';
import {
  canAddRow,
  canRemoveRow,
  columnSettingsDraftReducer,
  createColumnSettingsDraft,
  isDraftValid,
  selectAvailableFields,
  selectDraftColumns,
  type ColumnSettingsDraft,
  type ColumnSettingsDraftAction,
} from './columnSettingsDraft';
import { SortableColumnRow } from './SortableColumnRow';

export type TableColumnSettingsFormProps<T extends object> = Omit<
  TableColumnSettingsDialogProps<T>,
  'open'
>;

/**
 * The settings dialog body with its draft. Mounted only while the dialog is
 * open, so every opening starts the draft from the current columns.
 */
export function TableColumnSettingsForm<T extends object>({
  fields,
  columns,
  onSave,
  onCancel,
  onRestoreDefaults,
}: TableColumnSettingsFormProps<T>) {
  const { t } = useTranslation();
  const [draft, dispatch] = useReducer(
    (
      current: ColumnSettingsDraft<GenericDataTableField<T>>,
      action: ColumnSettingsDraftAction<GenericDataTableField<T>>,
    ) => columnSettingsDraftReducer(current, action),
    undefined,
    () =>
      createColumnSettingsDraft(
        fields.map((field) => field.field),
        columns,
      ),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const rowWasAdded = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Rows are appended at the end of the scrolling list, so a new one is scrolled into view.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!rowWasAdded.current || list === null) return;
    rowWasAdded.current = false;
    list.scrollTop = list.scrollHeight;
  }, [draft.rows]);

  const total = fields.length;
  const rowIndexOf = (id: UniqueIdentifier) => draft.rows.findIndex((row) => row.key === id);
  const rowLabel = (index: number) => {
    const row = draft.rows[index];
    const option = fields.find((field) => field.field === row?.field);

    return option === undefined ? String(index + 1) : t(option.labelKey);
  };
  const optionsFor = (rowKey: number) => {
    const available = new Set<string>(selectAvailableFields(draft, rowKey));

    return fields.filter((field) => available.has(field.field));
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const index = rowIndexOf(active.id);
      if (index < 0) return undefined;

      return t('table.settings.dnd.pickedUp', {
        label: rowLabel(index),
        position: index + 1,
        total,
      });
    },
    onDragOver: ({ active, over }) => {
      const index = rowIndexOf(active.id);
      const position = over === null ? -1 : rowIndexOf(over.id) + 1;
      if (index < 0 || position < 1) return undefined;

      return t('table.settings.dnd.movedOver', { label: rowLabel(index), position, total });
    },
    onDragEnd: ({ active, over }) => {
      const index = rowIndexOf(active.id);
      if (index < 0) return undefined;
      const overIndex = over === null ? -1 : rowIndexOf(over.id);
      const position = (overIndex < 0 ? index : overIndex) + 1;

      return t('table.settings.dnd.dropped', { label: rowLabel(index), position, total });
    },
    onDragCancel: ({ active }) => {
      const index = rowIndexOf(active.id);
      if (index < 0) return undefined;

      return t('table.settings.dnd.cancelled', { label: rowLabel(index) });
    },
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null) return;
    const from = rowIndexOf(active.id);
    const to = rowIndexOf(over.id);
    if (from < 0 || to < 0 || from === to) return;
    dispatch({ type: 'rowMoved', from, to });
  };

  const addRow = () => {
    if (!canAddRow(draft)) return;
    rowWasAdded.current = true;
    dispatch({ type: 'rowAdded' });
  };

  const submit = () => {
    if (!isDraftValid(draft)) {
      dispatch({ type: 'submitted' });
      return;
    }
    onSave(selectDraftColumns(draft));
  };

  // The library's setter contract is a state setter, so a function updater must be resolved.
  const resolveVisibility = (next: SetStateAction<boolean>, current: boolean) =>
    typeof next === 'function' ? next(current) : next;
  const handleSetVisibility = (next: SetStateAction<boolean>) => {
    if (!resolveVisibility(next, true)) onCancel();
  };
  const handleSetConfirmVisibility = (next: SetStateAction<boolean>) => {
    setConfirmOpen(resolveVisibility(next, confirmOpen));
  };

  const used = selectDraftColumns(draft).length;

  return (
    <>
      <Dialog
        headingProps={{ text: t('table.settings.title'), centered: true }}
        visibility
        onSetVisibility={handleSetVisibility}
        bottomSeparator
        buttonProps={[
          // The footer is a right-aligned row; the auto margin pulls this action to the left.
          {
            label: t('table.settings.restoreDefaults'),
            style: 'text',
            className: 'mr-auto',
            onClick: () => setConfirmOpen(true),
          },
          { label: t('table.settings.cancel'), style: 'outline', onClick: onCancel },
          { label: t('table.settings.save'), style: 'filled', onClick: submit },
        ]}
      >
        {/* Capped below the dialog's own limit, so the dialog body never scrolls and the
            overflow lands on the column list alone. */}
        <div className="flex max-h-[55vh] flex-col gap-4">
          <div className="border-b border-[var(--border-subtle)]">
            <span className="-mb-px inline-block border-b-[3px] border-[var(--navigation-accent)] px-6 pb-2 text-base font-bold text-[var(--text)]">
              {t('table.settings.tab.columns')}
            </span>
          </div>
          <p className="m-0 flex gap-3 text-sm text-[var(--muted)]">
            <span
              aria-hidden="true"
              className="mt-[7px] size-1.5 shrink-0 bg-[var(--navigation-accent)]"
            />
            <span>{t('table.settings.hint')}</span>
          </p>
          <div>
            <h3 className="m-0 text-sm font-bold text-[var(--text)]">
              {t('table.settings.layout.title')}
            </h3>
            <p role="status" aria-live="polite" className="m-0 text-sm text-[var(--text)]">
              {t('table.settings.layout.usedLabel')}{' '}
              <strong className="font-bold">
                {t('table.settings.layout.usedCount', { used, total })}
              </strong>
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={{
              announcements,
              screenReaderInstructions: { draggable: t('table.settings.dnd.instructions') },
            }}
          >
            <SortableContext
              items={draft.rows.map((row) => row.key)}
              strategy={verticalListSortingStrategy}
            >
              <ol ref={listRef} className="m-0 min-h-0 list-none space-y-1 overflow-y-auto p-0">
                {draft.rows.map((row, index) => (
                  <SortableColumnRow
                    key={row.key}
                    row={row}
                    position={index + 1}
                    options={optionsFor(row.key)}
                    invalid={draft.submitted && row.field === null}
                    removable={canRemoveRow(draft)}
                    onFieldChange={(field) =>
                      dispatch({ type: 'rowFieldChanged', key: row.key, field })
                    }
                    onRemove={() => dispatch({ type: 'rowRemoved', key: row.key })}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          <button
            type="button"
            className="group ml-12 inline-flex items-center gap-2 self-start text-sm text-[#506579] disabled:cursor-default disabled:text-[#b3bcc7]"
            disabled={!canAddRow(draft)}
            onClick={addRow}
          >
            <span
              aria-hidden="true"
              className="pi pi-plus text-xs text-[var(--navigation-accent)] group-disabled:text-[#b3bcc7]"
            />
            <span className="underline underline-offset-2">{t('table.settings.addColumn')}</span>
          </button>
        </div>
      </Dialog>
      <Dialog
        headingProps={{ text: t('table.settings.restore.title') }}
        visibility={confirmOpen}
        onSetVisibility={handleSetConfirmVisibility}
        bottomSeparator
        buttonsPosition="column"
        buttonProps={[
          {
            label: t('table.settings.restore.confirm'),
            style: 'filled',
            className: 'w-full justify-center',
            onClick: onRestoreDefaults,
          },
          {
            label: t('table.settings.restore.back'),
            style: 'outline',
            className: 'w-full justify-center',
            onClick: () => setConfirmOpen(false),
          },
        ]}
      >
        <p className="m-0 text-sm text-[var(--text)]">{t('table.settings.restore.body')}</p>
      </Dialog>
    </>
  );
}
