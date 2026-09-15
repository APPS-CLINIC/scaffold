import type { GenericDataTableFieldConfig } from './GenericDataTable.types';

/**
 * Apply an ordered list of field names to the configured fields: the result
 * holds the matching field configs in the given order. Names the config does
 * not know and repeated names are dropped; an empty result falls back to
 * `fields`. The input `fields` reference is returned whenever the result would
 * be identical, so memoized consumers stay quiet.
 */
export function resolveColumnFields<T extends object>(
  fields: readonly GenericDataTableFieldConfig<T>[],
  columns: readonly string[] | undefined,
): readonly GenericDataTableFieldConfig<T>[] {
  if (columns === undefined) return fields;

  const unusedByName = new Map<string, GenericDataTableFieldConfig<T>>(
    fields.map((field) => [field.field, field]),
  );
  const resolved: GenericDataTableFieldConfig<T>[] = [];
  for (const name of columns) {
    const field = unusedByName.get(name);
    if (field === undefined) continue;
    unusedByName.delete(name);
    resolved.push(field);
  }

  if (resolved.length === 0) return fields;
  const unchanged =
    resolved.length === fields.length && resolved.every((field, index) => field === fields[index]);
  return unchanged ? fields : resolved;
}
