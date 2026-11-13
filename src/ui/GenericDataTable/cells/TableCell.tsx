import type { ReactNode } from 'react';
import type {
  GenericDataTableCellComponent,
  GenericDataTableField,
  GenericDataTableFieldConfig,
} from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

export interface TableCellProps<T extends object> {
  column: GenericDataTableFieldConfig<T>;
  locale: string;
  notAvailable: ReactNode;
  row: T;
  rowIndex: number;
}

/** One field renderer for flat columns, responsive details and tree columns. */
export function TableCell<T extends object>({
  column,
  locale,
  notAvailable,
  row,
  rowIndex,
}: TableCellProps<T>) {
  const field = column.field;
  if (!column.component) return renderCellValue(row[field], notAvailable);

  // The field config checks each key/component pair. Iterating its union loses
  // that correlation, so keep the single necessary widening at this boundary.
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
