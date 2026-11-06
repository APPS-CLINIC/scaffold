import { useTranslation } from 'react-i18next';
import { Select } from '@/ui';
import type { TableFilterOption, TableFilterProps, TableFilterValues } from '@/ui';

export interface SelectFilterProps {
  options: readonly TableFilterOption[];
}

/** A single-choice filter with the same control/chip contract as MultiSelectFilter. */
export function SelectFilter({
  inputId,
  labelId,
  param,
  values,
  onChange,
  options,
}: TableFilterProps & SelectFilterProps) {
  const { t } = useTranslation();
  return (
    <Select
      inputId={inputId}
      aria-labelledby={labelId}
      options={options.map((option) => ({
        value: option.value,
        label: 'labelKey' in option ? t(option.labelKey) : option.label,
      }))}
      value={values[param]?.[0] ?? null}
      onChange={(event: { value: unknown }) =>
        onChange({ [param]: typeof event.value === 'string' && event.value ? [event.value] : [] })
      }
      placeholder={t('table.filters.placeholder')}
      showClear
      sortOptions={false}
      className="w-full"
    />
  );
}

SelectFilter.useSummary = function useSelectSummary(
  values: TableFilterValues,
  { param, options }: SelectFilterProps & { param: string },
): string {
  const { t } = useTranslation();
  const value = values[param]?.[0];
  const option = options.find((item) => item.value === value);
  return option ? ('labelKey' in option ? t(option.labelKey) : option.label) : (value ?? '');
};
