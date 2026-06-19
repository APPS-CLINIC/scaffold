import { z } from 'zod';

/**
 * The URL is the single source of truth for "queryable" view state:
 * search, filters, sorting and pagination. This schema validates and
 * normalizes raw search params so the rest of the app works with a typed,
 * always-valid object.
 *
 * `.catch(...)` makes parsing total: a malformed/hand-edited URL can never
 * crash the app — it falls back to the default for that field.
 */
export const itemsQuerySchema = z.object({
  q: z.string().catch(''),
  status: z.enum(['all', 'active', 'inactive']).catch('all'),
  sort: z.enum(['name', 'value', 'createdAt']).catch('createdAt'),
  dir: z.enum(['asc', 'desc']).catch('desc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(200).catch(50),
});

export type ItemsQuery = z.infer<typeof itemsQuerySchema>;

/** Canonical defaults, derived from the schema (no duplication). */
export const defaultItemsQuery: ItemsQuery = itemsQuerySchema.parse({});

/** Parse a validated query object out of URLSearchParams. */
export function parseItemsQuery(params: URLSearchParams): ItemsQuery {
  return itemsQuerySchema.parse(Object.fromEntries(params));
}

/**
 * Serialize a query back to a flat string record for `setSearchParams`,
 * omitting values equal to their default. This keeps URLs short and
 * shareable (e.g. `/items` instead of `/items?q=&status=all&page=1...`).
 */
export function serializeItemsQuery(query: ItemsQuery): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(query) as (keyof ItemsQuery)[]) {
    const value = query[key];
    if (value !== defaultItemsQuery[key]) {
      out[key] = String(value);
    }
  }
  return out;
}
