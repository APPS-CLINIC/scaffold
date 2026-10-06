import { z } from 'zod';

/** Values kept per filter key; the canonical (sorted) list is cut after this many. */
export const MAX_FILTER_VALUES = 100;

/** Params of the list query itself; every other param is a filter. */
const LIST_PARAMS: ReadonlySet<string> = new Set(['q', 'sort', 'dir', 'page', 'pageSize']);

// A name, optionally with one dotted part such as `reviewDate.from`.
const filterKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-zA-Z0-9_-]*(\.[a-z][a-zA-Z0-9_-]*)?$/)
  .refine((key) => !LIST_PARAMS.has(key));
const filterValueSchema = z.string().min(1).max(200);

/** Filter values per param, each value written as its own repeated URL param. */
type ListFilters = Record<string, string[]>;

/**
 * The URL is the single source of truth for "queryable" view state: search,
 * sorting and pagination. This schema validates and normalizes raw search
 * params so the rest of the app works with a typed, always-valid object.
 *
 * `.catch(...)` makes parsing total: a malformed/hand-edited URL can never
 * crash the app — it falls back to the default for that field. This is a
 * deliberately generic list query. Every other param is a feature filter,
 * named like the service param it becomes and repeated once per value; the
 * owning feature validates it again with its own Zod schema.
 */
export const listQuerySchema = z.object({
  q: z.string().catch(''),
  filters: z.record(filterKeySchema, z.array(filterValueSchema)).catch({}),
  sort: z.string().catch(''),
  dir: z.enum(['asc', 'desc']).catch('asc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(200).catch(10),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

/** Canonical defaults, derived from the schema (no duplication). */
export const defaultListQuery: ListQuery = listQuerySchema.parse({});

/**
 * Keep the valid values of one filter key, trimmed, without duplicates, sorted
 * and capped, so equal filters always produce the same URL and request.
 */
function normalizeFilterValues(values: readonly string[]): string[] {
  const valid = values
    .map((value) => value.trim())
    .filter((value) => filterValueSchema.safeParse(value).success);
  return [...new Set(valid)].sort().slice(0, MAX_FILTER_VALUES);
}

/** Parse a validated query object; params other than the list's own are filters. */
export function parseListQuery(params: URLSearchParams): ListQuery {
  const rawFilters = new Map<string, string[]>();

  for (const [key, rawValue] of params) {
    if (!filterKeySchema.safeParse(key).success) continue;
    rawFilters.set(key, [...(rawFilters.get(key) ?? []), rawValue]);
  }

  const filters: ListFilters = {};
  for (const [key, rawValues] of rawFilters) {
    const values = normalizeFilterValues(rawValues);
    if (values.length > 0) filters[key] = values;
  }

  return listQuerySchema.parse({ ...Object.fromEntries(params), filters });
}

/**
 * Serialize a query back to a record for `setSearchParams`, omitting values
 * equal to their default. This keeps URLs short and shareable; each filter
 * value becomes its own param.
 */
export function serializeListQuery(query: ListQuery): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of Object.keys(query) as (keyof ListQuery)[]) {
    if (key === 'filters') continue;

    const value = query[key];
    if (value !== defaultListQuery[key]) {
      out[key] = String(value);
    }
  }

  for (const key of Object.keys(query.filters).sort()) {
    if (!filterKeySchema.safeParse(key).success) continue;

    const values = normalizeFilterValues(query.filters[key] ?? []);
    if (values.length > 0) out[key] = values;
  }

  return out;
}

/** Compare list queries without relying on object identity for the filter map. */
export function areListQueriesEqual(left: ListQuery, right: ListQuery): boolean {
  if (
    left.q !== right.q ||
    left.sort !== right.sort ||
    left.dir !== right.dir ||
    left.page !== right.page ||
    left.pageSize !== right.pageSize
  ) {
    return false;
  }

  const leftFilterKeys = Object.keys(left.filters);
  const rightFilterKeys = Object.keys(right.filters);
  return (
    leftFilterKeys.length === rightFilterKeys.length &&
    leftFilterKeys.every((key) => {
      const leftValues = left.filters[key] ?? [];
      const rightValues = right.filters[key];
      return (
        rightValues !== undefined &&
        leftValues.length === rightValues.length &&
        leftValues.every((value, index) => value === rightValues[index])
      );
    })
  );
}
