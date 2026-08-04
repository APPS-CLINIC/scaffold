import type { ReactNode } from 'react';
import type {
  GenericDataTableCellComponent,
  GenericDataTableDetailField,
  GenericDataTableField,
  GenericDataTableLabels,
} from '../GenericDataTable.types';

function renderDefaultDetail(value: unknown, notAvailable: ReactNode): ReactNode {
  if (value === null || value === undefined) return notAvailable;

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return notAvailable;
  }
}

interface DetailValueProps<T extends object> {
  detail: GenericDataTableDetailField<T>;
  labels: GenericDataTableLabels<T>;
  locale: string;
  row: T;
  rowIndex: number;
}

export function DetailValue<T extends object>({
  detail,
  labels,
  locale,
  row,
  rowIndex,
}: DetailValueProps<T>) {
  const field = detail.field;
  const value = row[field];

  if (!detail.component) return renderDefaultDetail(value, labels.notAvailable);

  const Component = detail.component as unknown as GenericDataTableCellComponent<
    T,
    GenericDataTableField<T>
  >;

  return (
    <Component
      row={row}
      value={value}
      field={field}
      locale={locale}
      notAvailable={labels.notAvailable}
      rowIndex={rowIndex}
    />
  );
}
