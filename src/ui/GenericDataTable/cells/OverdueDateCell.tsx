import { useTranslation } from 'react-i18next';
import { daysPastIsoDate, formatIsoDmyDate } from '@/i18n/dateFormats';
import { Status } from '@/ui';
import type { GenericDataTableCellProps, GenericDataTableField } from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

/**
 * A `DateCell` that flags a past date: the IWA "incomplete" status, its label
 * counting the days overdue, above the formatted date. Empty and non-string
 * values fall back exactly like `DateCell`.
 */
export function OverdueDateCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, locale, notAvailable }: GenericDataTableCellProps<T, K>) {
  const { t } = useTranslation();

  if (value === null || value === undefined || value === '') return notAvailable;
  if (typeof value !== 'string') return renderCellValue(value, notAvailable);

  const formatted = formatIsoDmyDate(value, locale);
  const daysOverdue = daysPastIsoDate(value);

  // Not an ISO date: shown as-is, without a <time> whose dateTime would be invalid.
  if (daysOverdue === null) return formatted;
  if (daysOverdue <= 0) return <time dateTime={value}>{formatted}</time>;

  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <Status
        type="incomplete"
        label={t('common.overdueDays', { count: daysOverdue })}
        // Table columns are 144–160px wide: the label wraps under the icon
        // instead of being truncated to one line by the library.
        className="min-w-0 !items-start [&_*]:!text-sm [&_*]:!leading-5 [&_*]:!whitespace-normal [&_*]:!break-words"
      />
      <time dateTime={value}>{formatted}</time>
    </span>
  );
}
