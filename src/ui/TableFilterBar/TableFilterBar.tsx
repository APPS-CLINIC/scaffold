import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, IconTextButton, InlineLink, SearchWithAutocomplete } from '@/ui';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import { FilterDialog } from './FilterDialog';
import { getFilterableFields } from './filterableFields';
import type { TableFilterBarProps, TableFilterValue } from './TableFilterBar.types';

/**
 * The table's filter section: the "customize filters" button with the clear
 * link and one removable chip per applied filter, the search input and an
 * optional end slot, plus the filter dialog. Which filters exist comes from
 * the table config (`field.filter`), exactly like `sortable` drives sorting;
 * executing the filters (URL/server) stays with the owner via `onChange`.
 */
export function TableFilterBar<T extends object>({
  fields,
  values,
  onChange,
  labels,
  locale,
  endSlot,
}: TableFilterBarProps<T>) {
  const { t } = useTranslation();
  const [dialogVisible, setDialogVisible] = useState(false);

  const filterableFields = useMemo(() => getFilterableFields(fields), [fields]);
  const activeFields = filterableFields.filter((field) => values[String(field.field)]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(new Date(`${iso}T00:00:00`));

  const chipValueLabel = (
    field: (typeof filterableFields)[number],
    value: TableFilterValue,
  ): string => {
    if (field.filter.type === 'select' && typeof value === 'string') {
      const option = field.filter.options.find((candidate) => candidate.value === value);
      return option?.labelKey ? t(option.labelKey) : value;
    }
    if (typeof value === 'object' && value !== null) {
      const from = value.from ? formatDate(value.from) : '…';
      const to = value.to ? formatDate(value.to) : '…';
      return `${from} – ${to}`;
    }
    return String(value);
  };

  const removeFilter = (key: string) => {
    const next = { ...values };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="flex flex-col items-start gap-8 rounded bg-[var(--surface-muted)] p-3">
      <div className="flex w-full flex-col items-start gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <IconTextButton
            secondary
            icon={<span aria-hidden="true" className="pi pi-sliders-h text-sm" />}
            label={labels.customizeFilters}
            onClick={() => setDialogVisible(true)}
          />
          {activeFields.length > 0 ? (
            <InlineLink
              size="small"
              label={`✕ ${labels.clearFilters} (${activeFields.length})`}
              onClick={() => onChange({})}
            />
          ) : null}
        </div>

        {activeFields.length > 0 ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {activeFields.map((field) => {
              const key = String(field.field);
              const value = values[key];
              if (value === undefined) return null;

              return (
                <li key={key}>
                  <Chip
                    removable
                    label={`${t(field.labelKey)}: ${chipValueLabel(field, value)}`}
                    dataTestId={`filter-chip-${key}`}
                    onClick={() => removeFilter(key)}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <SearchWithAutocomplete
          className="w-full max-w-96"
          placeholder={labels.searchPlaceholder}
        />
        {endSlot}
      </div>

      <FilterDialog
        fields={filterableFields}
        values={values}
        visibility={dialogVisible}
        onSetVisibility={setDialogVisible}
        onApply={onChange}
        labels={labels}
      />
    </div>
  );
}
