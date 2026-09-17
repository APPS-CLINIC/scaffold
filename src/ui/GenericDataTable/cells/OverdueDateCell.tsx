import { useTranslation } from 'react-i18next';
import { formatIsoDmyDate, isPastIsoDate } from '@/i18n/dateFormats';
import { Status } from '@/ui';
import type { GenericDataTableCellProps, GenericDataTableField } from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

/**
 * A `DateCell` that flags a past date: the IWA "incomplete" overdue status on
 * its own line, the formatted date below it. Empty and non-string values fall
 * back exactly like `DateCell`.
 */
export function OverdueDateCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, locale, notAvailable }: GenericDataTableCellProps<T, K>) {
  const { t } = useTranslation();

  if (value === null || value === undefined || value === '') return notAvailable;
  if (typeof value !== 'string') return renderCellValue(value, notAvailable);

  const formatted = formatIsoDmyDate(value, locale);
  if (!isPastIsoDate(value)) return formatted;

  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <Status
        type="incomplete"
        label={t('common.status.overdue')}
        className="[&_*]:!text-sm [&_*]:!leading-5"
      />
      <time dateTime={value}>{formatted}</time>
    </span>
  );
}
