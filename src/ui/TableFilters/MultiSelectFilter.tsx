import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MultiSelect } from '@/ui';
import type { TableFilterOption, TableFilterProps, TableFilterValues } from './TableFilters.types';

// The library draws the multiselect taller than its other fields; the filter rows give every
// field one 40px height. The classes reach the PrimeReact parts whether the class name lands
// on the multiselect itself or on a wrapper around it. Focus shows as an accent border with
// no halo, like the list search.
const MULTI_SELECT_CLASS_NAME = [
  'w-full !h-auto !min-h-0 [&_.p-multiselect]:!h-auto [&_.p-multiselect]:!min-h-0',
  '[&_.p-multiselect-label]:!px-3 [&_.p-multiselect-label]:!py-[7px] [&_.p-multiselect-label]:!text-base [&_.p-multiselect-label]:!leading-6',
  '[&.p-focus]:!border-[var(--navigation-accent)] [&.p-focus]:![box-shadow:none] [&_.p-focus]:!border-[var(--navigation-accent)] [&_.p-focus]:![box-shadow:none] [&_input:focus]:!outline-none',
].join(' ');

/** Up to five options fit at a glance, so the panel offers a search from the sixth on. */
const MIN_OPTIONS_FOR_SEARCH = 6;

// The option panel opens on the document body, outside the class name above.
const MULTI_SELECT_PANEL_CLASS_NAME =
  '[&_input:focus]:!border-[var(--navigation-accent)] [&_input:focus]:![box-shadow:none] [&_input:focus]:!outline-none';

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
 * Picks any number of options. A longer list has a search that narrows it to labels
 * containing the text. A value without an option is not shown, and leaves the filter once
 * the user picks again.
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
      filter={items.length >= MIN_OPTIONS_FOR_SEARCH}
      filterMatchMode="contains"
      showHeader
      showSelectAll={false}
      selectionLimit={selectionLimit}
      display="comma"
      placeholder={t('table.filters.placeholder')}
      filterPlaceholder={t('table.filters.search')}
      emptyFilterMessage={t('table.filters.noResults')}
      emptyMessage={t('table.filters.noOptions')}
      className={MULTI_SELECT_CLASS_NAME}
      panelClassName={MULTI_SELECT_PANEL_CLASS_NAME}
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
