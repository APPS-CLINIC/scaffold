import type { GenericDataTableCellProps, GenericDataTableField } from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

export function UnderlinedTextCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, notAvailable }: GenericDataTableCellProps<T, K>) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean' &&
      typeof value !== 'bigint')
  ) {
    return notAvailable;
  }

  return (
    <span className="inline-block max-w-full whitespace-normal break-words font-medium text-[var(--link)] underline decoration-[var(--border)] underline-offset-2">
      {renderCellValue(value, notAvailable)}
    </span>
  );
}
