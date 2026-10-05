import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MultiSelect } from '@/ui';
import type { TableFilterOption, TableFilterProps, TableFilterValues } from './TableFilters.types';

export interface MultiSelectFilterProps {
  options: readonly TableFilterOption[];
  /** The most values the user may pick; the list stops offering more. */
  selectionLimit?: number;
}

/** The options with their labels in the active language. */
function useOptionItems(options: readonly TableFilterOption[]) {
  const { t } = useTranslation();
  return useMemo(
    () =>
      options.map((option) => ({
        value: option.value,
        label: 'labelKey' in option ? t(option.labelKey) : option.label,
      })),
    [options, t],
  );
}

function toStringValues(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/**
 * Picks any number of options; typing in the list narrows it to labels containing the text.
 * A value without an option is not shown, and leaves the filter once the user picks again.
 */
export function MultiSelectFilter({
  inputId,
  param,
  values,
  onChange,
  options,
  selectionLimit,
}: TableFilterProps & MultiSelectFilterProps) {
  const { t } = useTranslation();
  const items = useOptionItems(options);

  return (
    <MultiSelect
      inputId={inputId}
      value={(values[param] ?? []).filter((value) => items.some((item) => item.value === value))}
      options={items}
      optionLabel="label"
      optionValue="value"
      onChange={(event) => onChange({ [param]: toStringValues(event.value) })}
      filter
      filterMatchMode="contains"
      showHeader
      showSelectAll={false}
      selectionLimit={selectionLimit}
      display="comma"
      placeholder={t('table.filters.placeholder')}
      filterPlaceholder={t('table.filters.search')}
      emptyFilterMessage={t('table.filters.noResults')}
      emptyMessage={t('table.filters.noOptions')}
      className="w-full"
    />
  );
}

MultiSelectFilter.useSummary = function useMultiSelectSummary(
  values: TableFilterValues,
  { param, options }: MultiSelectFilterProps & { param: string },
): string {
  const items = useOptionItems(options);
  return (values[param] ?? [])
    .map((value) => items.find((item) => item.value === value)?.label ?? value)
    .join(', ');
};
