import { useTranslation } from 'react-i18next';
import { daysPastIsoDate, formatIsoDmyDate } from '@/i18n/dateFormats';
import { Status } from '@/ui';

interface OverdueDateProps {
  /** ISO local date; anything else renders verbatim. */
  value: string;
  locale: string;
}

/**
 * A deadline date. Once it is in the past it gains the IWA "incomplete" status
 * whose label counts the days overdue, with the formatted date below.
 */
export function OverdueDate({ value, locale }: OverdueDateProps) {
  const { t } = useTranslation();
  const formatted = formatIsoDmyDate(value, locale);
  const daysOverdue = daysPastIsoDate(value);

  // Not an ISO date: shown as-is, without a <time> whose dateTime would be invalid.
  if (daysOverdue === null) return formatted;
  if (daysOverdue <= 0) return <time dateTime={value}>{formatted}</time>;

  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <Status
        type="incomplete"
        label={t('customers.overdueDays', { count: daysOverdue })}
        // Table columns are 144–160px wide: the label wraps under the icon
        // instead of being truncated to one line by the library.
        className="min-w-0 !items-start [&_*]:!text-sm [&_*]:!leading-5 [&_*]:!whitespace-normal [&_*]:!break-words"
      />
      <time dateTime={value}>{formatted}</time>
    </span>
  );
}
