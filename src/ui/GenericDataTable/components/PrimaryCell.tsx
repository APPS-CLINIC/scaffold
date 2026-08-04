import type { ReactNode } from 'react';
import type {
  GenericDataTableCellComponent,
  GenericDataTableColumn,
  GenericDataTableField,
} from '../GenericDataTable.types';

interface PrimaryCellProps<T extends object> {
  column: GenericDataTableColumn<T>;
  locale: string;
  notAvailable: ReactNode;
  row: T;
  rowIndex: number;
}

export function PrimaryCell<T extends object>({
  column,
  locale,
  notAvailable,
  row,
  rowIndex,
}: PrimaryCellProps<T>) {
  const field = column.field;
  const Component = column.component as unknown as GenericDataTableCellComponent<
    T,
    GenericDataTableField<T>
  >;

  return (
    <Component
      row={row}
      value={row[field]}
      field={field}
      locale={locale}
      notAvailable={notAvailable}
      rowIndex={rowIndex}
    />
  );
}
