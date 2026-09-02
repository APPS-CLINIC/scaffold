import { formatIsoDmyDate } from '@/i18n/dateFormats';
import type { GenericDataTableCellProps, GenericDataTableField } from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

export function DateCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, locale, notAvailable }: GenericDataTableCellProps<T, K>) {
  if (value === null || value === undefined || value === '') return notAvailable;
  if (typeof value !== 'string') return renderCellValue(value, notAvailable);

  return formatIsoDmyDate(value, locale);
}
