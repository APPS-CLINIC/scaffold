import { z } from 'zod';

/**
 * The URL is the single source of truth for "queryable" view state: search,
 * sorting and pagination. This schema validates and normalizes raw search
 * params so the rest of the app works with a typed, always-valid object.
 *
 * `.catch(...)` makes parsing total: a malformed/hand-edited URL can never
 * crash the app — it falls back to the default for that field. This is a
 * deliberately generic list query; extend it (or add per-feature schemas) as
 * you build real list views.
 */
export const listQuerySchema = z.object({
  q: z.string().catch(''),
  sort: z.string().catch(''),
  dir: z.enum(['asc', 'desc']).catch('asc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(200).catch(50),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

/** Canonical defaults, derived from the schema (no duplication). */
export const defaultListQuery: ListQuery = listQuerySchema.parse({});

/** Parse a validated query object out of URLSearchParams. */
export function parseListQuery(params: URLSearchParams): ListQuery {
  return listQuerySchema.parse(Object.fromEntries(params));
}

/**
 * Serialize a query back to a flat string record for `setSearchParams`,
 * omitting values equal to their default. This keeps URLs short and shareable.
 */
export function serializeListQuery(query: ListQuery): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(query) as (keyof ListQuery)[]) {
    const value = query[key];
    if (value !== defaultListQuery[key]) {
      out[key] = String(value);
    }
  }
  return out;
}
