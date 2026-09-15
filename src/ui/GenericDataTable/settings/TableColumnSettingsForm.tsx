import { useReducer, useRef, useState, type SetStateAction } from 'react';
import { flushSync } from 'react-dom';
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
import { Button, CustomizableDialog } from 'iwa-react-components';
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

// The library pads the content and sizes the dialog itself, hence the important modifiers.
// Without the padding the tab line and the footer separators reach the dialog edges, so
// every section pads itself.
const DIALOG_CONTENT_CLASS_NAME = 'flex min-h-0 flex-col !p-0';
const SETTINGS_DIALOG_CLASS_NAME =
  '!h-[835px] !max-h-[calc(100vh-2rem)] !w-[600px] !max-w-[calc(100vw-2rem)]';
const RESTORE_DIALOG_CLASS_NAME = '!min-h-[296px] !w-[420px] !max-w-[calc(100vw-2rem)]';
const DIALOG_FOOTER_CLASS_NAME =
  'flex shrink-0 gap-3 border-t border-[var(--border-subtle)] px-6 py-4';

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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  // Both scrolls measure the list, so the update is committed to the DOM first.
  const addRow = () => {
    if (!canAddRow(draft)) return;
    flushSync(() => dispatch({ type: 'rowAdded' }));
    const list = listRef.current;
    if (list !== null) list.scrollTop = list.scrollHeight;
  };

  const submit = () => {
    if (isDraftValid(draft)) {
      onSave(selectDraftColumns(draft));
      return;
    }
    flushSync(() => dispatch({ type: 'submitted' }));
    const firstEmpty = draft.rows.findIndex((row) => row.field === null);
    listRef.current?.children.item(firstEmpty)?.scrollIntoView({ block: 'nearest' });
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
      <CustomizableDialog
        headingProps={{ text: t('table.settings.title'), centered: true }}
        visibility
        onSetVisibility={handleSetVisibility}
        className={SETTINGS_DIALOG_CLASS_NAME}
        contentClassName={DIALOG_CONTENT_CLASS_NAME}
      >
        <div className="border-b border-[var(--border-subtle)] px-6 pt-4">
          <span className="-mb-px inline-block border-b-[3px] border-[var(--navigation-accent)] px-6 pb-2 text-base font-bold text-[var(--text)]">
            {t('table.settings.tab.columns')}
          </span>
        </div>
        {/* The dialog height is fixed, so the overflow lands on the column list alone. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4">
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
        <div className={`${DIALOG_FOOTER_CLASS_NAME} items-center`}>
          <Button
            label={t('table.settings.restoreDefaults')}
            style="text"
            size="medium"
            className="mr-auto"
            onClick={() => setConfirmOpen(true)}
          />
          <Button
            label={t('table.settings.cancel')}
            style="outline"
            size="medium"
            onClick={onCancel}
          />
          <Button label={t('table.settings.save')} style="filled" size="medium" onClick={submit} />
        </div>
      </CustomizableDialog>
      <CustomizableDialog
        headingProps={{ text: t('table.settings.restore.title') }}
        visibility={confirmOpen}
        onSetVisibility={handleSetConfirmVisibility}
        className={RESTORE_DIALOG_CLASS_NAME}
        contentClassName={DIALOG_CONTENT_CLASS_NAME}
      >
        <p className="m-0 flex-1 px-6 pb-6 pt-2 text-sm text-[var(--text)]">
          {t('table.settings.restore.body')}
        </p>
        <div className={`${DIALOG_FOOTER_CLASS_NAME} flex-col`}>
          <Button
            label={t('table.settings.restore.confirm')}
            style="filled"
            size="medium"
            className="w-full justify-center"
            onClick={onRestoreDefaults}
          />
          <Button
            label={t('table.settings.restore.back')}
            style="outline"
            size="medium"
            className="w-full justify-center"
            onClick={() => setConfirmOpen(false)}
          />
        </div>
      </CustomizableDialog>
    </>
  );
}
