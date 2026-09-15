import { renderCellValue } from '@/ui';
import type { GenericDataTableCellProps, GenericDataTableField } from '@/ui';
import { OverdueDate } from '../OverdueDate';

/** `DateCell` with the overdue marker; empty and non-string values fall back the same way. */
export function OverdueDateCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, locale, notAvailable }: GenericDataTableCellProps<T, K>) {
  if (value === null || value === undefined || value === '') return notAvailable;
  if (typeof value !== 'string') return renderCellValue(value, notAvailable);

  return <OverdueDate value={value} locale={locale} />;
}
