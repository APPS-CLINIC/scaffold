import { z } from 'zod';

const FILTER_PREFIX = 'filter.';
const filterKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-zA-Z0-9_-]*$/);
const filterValueSchema = z.string().max(200);

/**
 * The URL is the single source of truth for "queryable" view state: search,
 * sorting and pagination. This schema validates and normalizes raw search
 * params so the rest of the app works with a typed, always-valid object.
 *
 * `.catch(...)` makes parsing total: a malformed/hand-edited URL can never
 * crash the app — it falls back to the default for that field. This is a
 * deliberately generic list query. Feature filters use `filter.<key>` URL
 * params and are validated again by the owning feature's Zod schema.
 */
export const listQuerySchema = z.object({
  q: z.string().catch(''),
  filters: z.record(filterKeySchema, filterValueSchema).catch({}),
  sort: z.string().catch(''),
  dir: z.enum(['asc', 'desc']).catch('asc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(200).catch(10),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

/** Canonical defaults, derived from the schema (no duplication). */
export const defaultListQuery: ListQuery = listQuerySchema.parse({});

/** Parse a validated query object, including generic `filter.<key>` params. */
export function parseListQuery(params: URLSearchParams): ListQuery {
  const filters: Record<string, string> = {};

  for (const [param, rawValue] of params) {
    if (!param.startsWith(FILTER_PREFIX)) continue;

    const key = param.slice(FILTER_PREFIX.length);
    const parsedKey = filterKeySchema.safeParse(key);
    const parsedValue = filterValueSchema.safeParse(rawValue);
    if (parsedKey.success && parsedValue.success && parsedValue.data !== '') {
      filters[parsedKey.data] = parsedValue.data;
    }
  }

  return listQuerySchema.parse({ ...Object.fromEntries(params), filters });
}

/**
 * Serialize a query back to a flat string record for `setSearchParams`,
 * omitting values equal to their default. This keeps URLs short and shareable.
 */
export function serializeListQuery(query: ListQuery): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(query) as (keyof ListQuery)[]) {
    if (key === 'filters') continue;

    const value = query[key];
    if (value !== defaultListQuery[key]) {
      out[key] = String(value);
    }
  }

  for (const key of Object.keys(query.filters).sort()) {
    const value = query.filters[key];
    const parsedKey = filterKeySchema.safeParse(key);
    const parsedValue = filterValueSchema.safeParse(value);
    if (parsedKey.success && parsedValue.success && parsedValue.data !== '') {
      out[`${FILTER_PREFIX}${parsedKey.data}`] = parsedValue.data;
    }
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
    leftFilterKeys.every((key) => left.filters[key] === right.filters[key])
  );
}
