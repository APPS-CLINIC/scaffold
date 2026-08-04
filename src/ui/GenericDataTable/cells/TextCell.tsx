import type { GenericDataTableCellProps, GenericDataTableField } from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

export function TextCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, notAvailable }: GenericDataTableCellProps<T, K>) {
  return renderCellValue(value, notAvailable);
}
