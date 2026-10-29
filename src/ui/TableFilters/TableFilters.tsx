import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionLink, IconTextButton } from '@/ui';
import { TableFilterDialog } from './TableFilterDialog';
import {
  isFilterableField,
  pickTableFilters,
  replaceTableFilters,
  tableFilterParam,
} from './tableFilterValues';
import type { TableFiltersProps, TableFilterValues } from './TableFilters.types';

/**
 * The filter controls of a table: "Customize filters" with its dialog, a link clearing
 * every applied filter, and one removable chip per applied filter. Only fields that
 * declare a `filter` take part, in the order of `fields`.
 */
export function TableFilters({
  fields,
  values,
  onChange,
  dialogValues,
  onDialogValuesChange,
}: TableFiltersProps) {
  const { t } = useTranslation();
  const [ownDialogValues, setOwnDialogValues] = useState<TableFilterValues | null>(null);
  const shownDialogValues = dialogValues === undefined ? ownDialogValues : dialogValues;
  const openerRef = useRef<Element | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const filterableFields = fields.filter(isFilterableField);
  const applied = pickTableFilters(values, filterableFields);
  const appliedFilters = filterableFields
    .map((field) => ({ field, fieldValues: pickTableFilters(applied, [field]) }))
    .filter(({ fieldValues }) => Object.keys(fieldValues).length > 0);

  const setDialogValues = (next: TableFilterValues | null) => {
    if (dialogValues === undefined) setOwnDialogValues(next);
    onDialogValuesChange?.(next);
  };
  const openDialog = () => {
    openerRef.current = document.activeElement;
    setDialogValues(applied);
  };
  // The dialog unmounts instead of hiding, so focus goes back to the control that opened it,
  // or to "Customize filters" when that control is gone.
  const closeDialog = () => {
    setDialogValues(null);
    const opener = openerRef.current;
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    else controlsRef.current?.querySelector('button')?.focus();
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <div ref={controlsRef} className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <IconTextButton
          secondary
          icon={<span aria-hidden="true" className="pi pi-sliders-h text-sm" />}
          label={t('table.filters.open')}
          onClick={openDialog}
        />
        {appliedFilters.length > 0 ? (
          <ActionLink
            icon={<span aria-hidden="true" className="pi pi-times text-sm" />}
            label={t('table.filters.clear', { count: appliedFilters.length })}
            onClick={() => onChange({})}
          />
        ) : null}
      </div>
      {appliedFilters.length > 0 ? (
        <ul
          aria-label={t('table.filters.applied')}
          className="m-0 flex list-none flex-wrap gap-2 p-0"
        >
          {appliedFilters.map(({ field, fieldValues }) => (
            <li key={field.field}>
              {field.filter.renderChip({
                label: t(field.labelKey),
                param: tableFilterParam(field),
                values: fieldValues,
                onRemove: () => onChange(replaceTableFilters(applied, [field], {})),
              })}
            </li>
          ))}
        </ul>
      ) : null}
      {shownDialogValues !== null ? (
        <TableFilterDialog
          fields={filterableFields}
          values={shownDialogValues}
          onSave={(next) => {
            closeDialog();
            onChange(next);
          }}
          onCancel={closeDialog}
        />
      ) : null}
    </div>
  );
}
