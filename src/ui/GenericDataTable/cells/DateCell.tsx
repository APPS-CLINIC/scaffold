import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import type { GenericDataTableCellProps, GenericDataTableField } from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

export function DateCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, locale, notAvailable }: GenericDataTableCellProps<T, K>) {
  if (value === null || value === undefined || value === '') return notAvailable;
  if (typeof value !== 'string') return renderCellValue(value, notAvailable);

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(date);
}
