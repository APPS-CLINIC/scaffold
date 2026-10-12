import type {
  FilterableTableField,
  TableFilterField,
  TableFilterValues,
} from './TableFilters.types';

type ParamField = Pick<TableFilterField, 'field' | 'filterParam'>;

export function isFilterableField<F extends TableFilterField>(
  field: F,
): field is F & FilterableTableField {
  return field.filter !== undefined;
}

/** The param a field filters by. */
export function tableFilterParam({ field, filterParam }: ParamField): string {
  return filterParam ?? field;
}

/** The params a field's filter owns: its param and any `param.<part>`. */
function ownsParam(field: ParamField, key: string): boolean {
  const param = tableFilterParam(field);
  return key === param || key.startsWith(`${param}.`);
}

/** The non-empty filter values of the given fields. */
export function pickTableFilters(
  values: TableFilterValues,
  fields: readonly ParamField[],
): Record<string, readonly string[]> {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => value.length > 0 && fields.some((field) => ownsParam(field, key)),
    ),
  );
}

/** `current` with the filters of `fields` replaced by `next`; other params stay as they are. */
export function replaceTableFilters(
  current: TableFilterValues,
  fields: readonly ParamField[],
  next: TableFilterValues,
): Record<string, string[]> {
  const kept = Object.entries(current).filter(
    ([key]) => !fields.some((field) => ownsParam(field, key)),
  );
  const replaced = Object.entries(pickTableFilters(next, fields));
  return Object.fromEntries([...kept, ...replaced].map(([key, value]) => [key, [...value]]));
}
