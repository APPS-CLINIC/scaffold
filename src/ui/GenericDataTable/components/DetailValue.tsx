import type {
  GenericDataTableCellComponent,
  GenericDataTableField,
  GenericDataTableFieldConfig,
  GenericDataTableLabels,
} from '../GenericDataTable.types';
import { renderCellValue } from '../cells/cellValue';

interface DetailValueProps<T extends object> {
  detail: GenericDataTableFieldConfig<T>;
  labels: GenericDataTableLabels<T>;
  locale: string;
  row: T;
  rowIndex: number;
}

/** Accordion value renderer: the field's cell component, or a primitive fallback. */
export function DetailValue<T extends object>({
  detail,
  labels,
  locale,
  row,
  rowIndex,
}: DetailValueProps<T>) {
  const field = detail.field;
  const value = row[field];

  if (!detail.component) return renderCellValue(value, labels.notAvailable);

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
