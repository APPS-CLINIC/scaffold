import type {
  GenericDataTableFieldConfig,
  GenericDataTableFilterConfig,
} from '../GenericDataTable';

/** A field whose config declares a `filter` (narrowed, non-optional). */
export type FilterableField<T extends object> = GenericDataTableFieldConfig<T> & {
  filter: GenericDataTableFilterConfig;
};

export function getFilterableFields<T extends object>(
  fields: readonly GenericDataTableFieldConfig<T>[],
): FilterableField<T>[] {
  return fields.filter((field): field is FilterableField<T> => field.filter !== undefined);
}
