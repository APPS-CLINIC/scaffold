import { useTranslation } from 'react-i18next';
import { formatIsoDate, formatIsoDmyDate, parseIsoDate } from '@/i18n/dateFormats';
import { DatePicker } from '@/ui';
import type { TableFilterProps, TableFilterValues } from './TableFilters.types';

/**
 * Two calendars for a range of days, as `param.from` and `param.to`; either may stay empty.
 * The calendars open on `document.body`, so the scrolling dialog rows do not clip them.
 */
export function DateRangeFilter({ inputId, labelId, param, values, onChange }: TableFilterProps) {
  const { t } = useTranslation();
  const from = values[`${param}.from`]?.[0];
  const to = values[`${param}.to`]?.[0];
  const fromDate = from ? parseIsoDate(from) : null;
  const toDate = to ? parseIsoDate(to) : null;
  const toInputId = `${inputId}-to`;

  const change = (nextFrom: Date | null, nextTo: Date | null) =>
    onChange({
      [`${param}.from`]: nextFrom ? [formatIsoDate(nextFrom)] : [],
      [`${param}.to`]: nextTo ? [formatIsoDate(nextTo)] : [],
    });

  return (
    <div role="group" aria-labelledby={labelId} className="flex items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        {t('table.filters.from')}
      </label>
      <DatePicker
        id={inputId}
        value={fromDate}
        maxDate={toDate ?? undefined}
        onChange={(date) => change(date, toDate)}
        appendTo={document.body}
        className="w-40 shrink-0"
        inputClassName="w-full min-w-0"
      />
      <span aria-hidden="true" className="text-[var(--muted)]">
        –
      </span>
      <label htmlFor={toInputId} className="sr-only">
        {t('table.filters.to')}
      </label>
      <DatePicker
        id={toInputId}
        value={toDate}
        minDate={fromDate ?? undefined}
        onChange={(date) => change(fromDate, date)}
        appendTo={document.body}
        className="w-40 shrink-0"
        inputClassName="w-full min-w-0"
      />
    </div>
  );
}

DateRangeFilter.useSummary = function useDateRangeSummary(
  values: TableFilterValues,
  { param }: { param: string },
): string {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const from = values[`${param}.from`]?.[0];
  const to = values[`${param}.to`]?.[0];

  if (from && to) {
    return t('table.filters.range.between', {
      from: formatIsoDmyDate(from, locale),
      to: formatIsoDmyDate(to, locale),
    });
  }
  if (from) return t('table.filters.range.from', { date: formatIsoDmyDate(from, locale) });
  if (to) return t('table.filters.range.to', { date: formatIsoDmyDate(to, locale) });
  return '';
};
