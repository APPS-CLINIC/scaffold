import { Fragment, useEffect, useId, useState, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CustomizableDialog, twMerge } from '@/ui';
import {
  DIALOG_CONTENT_CLASS_NAME,
  DIALOG_FOOTER_CLASS_NAME,
  resolveVisibility,
} from '../dialogFrame';
import { pickTableFilters, replaceTableFilters, tableFilterParam } from './tableFilterValues';
import type { FilterableTableField, TableFilterValues } from './TableFilters.types';

const FILTER_DIALOG_CLASS_NAME =
  '!h-[660px] !max-h-[calc(100vh-2rem)] !w-[824px] !max-w-[calc(100vw-2rem)]';

interface TableFilterDialogProps {
  /** The filterable fields, in display order: one row each. */
  fields: readonly FilterableTableField[];
  values: TableFilterValues;
  onSave: (values: TableFilterValues) => void;
  onCancel: () => void;
}

/**
 * Edits all filters at once: one row per field, in the given order. The draft lives only
 * while the dialog is mounted, and `TableFilters` mounts it only while open, so Cancel, the
 * close button and the backdrop discard it and every opening starts from `values`.
 */
export function TableFilterDialog({ fields, values, onSave, onCancel }: TableFilterDialogProps) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const titleId = `${idPrefix}-title`;
  const [draft, setDraft] = useState<TableFilterValues>(() => pickTableFilters(values, fields));

  const handleSetVisibility = (next: SetStateAction<boolean>) => {
    if (!resolveVisibility(next, true)) onCancel();
  };

  return (
    <CustomizableDialog
      visibility
      onSetVisibility={handleSetVisibility}
      className={FILTER_DIALOG_CLASS_NAME}
      contentClassName={DIALOG_CONTENT_CLASS_NAME}
    >
      {fields[0] === undefined ? null : <FocusOnOpen targetId={`${idPrefix}-${fields[0].field}`} />}
      {/* The heading is part of the unpadded content, so its line runs edge to edge; it sits
          in the band of the library's close button. The library names the dialog only after
          its own heading, so the dialog element is pointed at this one. */}
      <h2
        ref={(heading) => {
          heading?.closest('[role="dialog"]')?.setAttribute('aria-labelledby', titleId);
        }}
        id={titleId}
        className="m-0 shrink-0 border-b border-[var(--border-subtle)] px-14 py-4 text-center text-2xl font-bold leading-8 text-[var(--text)]"
      >
        {t('table.filters.title')}
      </h2>
      {/* Only the rows scroll, so the heading and the footer stay in view; the bar is hidden. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_24rem] items-center gap-x-6 gap-y-4">
          {fields.map((field) => {
            const inputId = `${idPrefix}-${field.field}`;
            const labelId = `${inputId}-label`;

            return (
              <Fragment key={field.field}>
                <label
                  id={labelId}
                  htmlFor={inputId}
                  className="text-right text-base text-[var(--text)]"
                >
                  {t(field.labelKey)}
                </label>
                <div className="min-w-0">
                  {field.filter.render({
                    inputId,
                    labelId,
                    param: tableFilterParam(field),
                    values: pickTableFilters(draft, [field]),
                    onChange: (next) =>
                      setDraft((current) => replaceTableFilters(current, [field], next)),
                  })}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
      <div className={twMerge(DIALOG_FOOTER_CLASS_NAME, 'justify-end')}>
        <Button
          label={t('table.filters.cancel')}
          style="outline"
          size="medium"
          onClick={onCancel}
        />
        <Button
          label={t('table.filters.save')}
          style="filled"
          size="medium"
          onClick={() => onSave(pickTableFilters(draft, fields))}
        />
      </div>
    </CustomizableDialog>
  );
}

/**
 * Focuses the first field once the dialog is open. The library's focus trap puts focus on
 * the close button in its own mount effect, which runs after this one, so the move waits
 * for a microtask: it then lands after the trap, and the trap keeps focus that is already
 * inside the dialog.
 */
function FocusOnOpen({ targetId }: { targetId: string }) {
  useEffect(() => {
    queueMicrotask(() => document.getElementById(targetId)?.focus());
  }, [targetId]);
  return null;
}
