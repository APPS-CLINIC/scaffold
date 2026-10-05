import { Fragment, useId, useState, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CustomizableDialog, twMerge } from '@/ui';
import { DialogHeading } from '../DialogHeading';
import {
  DIALOG_CONTENT_CLASS_NAME,
  DIALOG_FOOTER_CLASS_NAME,
  resolveVisibility,
} from '../dialogFrame';
import { FocusOnOpen } from '../FocusOnOpen';
import { pickTableFilters, replaceTableFilters, tableFilterParam } from './tableFilterValues';
import type { FilterableTableField, TableFilterValues } from './TableFilters.types';

const FILTER_DIALOG_CLASS_NAME = '!w-[824px] !max-w-[calc(100vw-2rem)]';
const FILTER_DIALOG_CONTENT_CLASS_NAME = `${DIALOG_CONTENT_CLASS_NAME} !h-[660px] !max-h-[calc(100vh-2rem)]`;

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
  const firstInputId = fields[0] === undefined ? undefined : `${idPrefix}-${fields[0].field}`;
  const [draft, setDraft] = useState<TableFilterValues>(() => pickTableFilters(values, fields));

  const handleSetVisibility = (next: SetStateAction<boolean>) => {
    if (!resolveVisibility(next, true)) onCancel();
  };

  return (
    <CustomizableDialog
      visibility
      onSetVisibility={handleSetVisibility}
      className={FILTER_DIALOG_CLASS_NAME}
      contentClassName={FILTER_DIALOG_CONTENT_CLASS_NAME}
    >
      {firstInputId === undefined ? null : (
        <FocusOnOpen target={() => document.getElementById(firstInputId)} />
      )}
      <DialogHeading text={t('table.filters.title')} centered divided />
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
