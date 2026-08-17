import { InlineLink } from '../../iwa';
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
    <InlineLink
      size="small"
      className="max-w-full whitespace-normal break-words font-medium"
      label={renderCellValue(value, notAvailable)}
    />
  );
}
