# ADR 0008 — Total parsing of search params with Zod

- **Status:** Superseded by ADR-0026
- **Date:** 2026-06-22

## Context

Search params are **untrusted input**: users hand-edit URLs,
share stale links, and bookmarks outlive schema changes. If
parsing can throw or produce the wrong type, one bad URL takes down the view.
We want parsing to be **total** — every possible input maps to a
valid, typed query object.

## Decision

We define the query with **Zod** and make every field **`.catch()` with
a default value**, in
[`urlState.schema.ts`](../../src/features/urlState/urlState.schema.ts):

```ts
export const listQuerySchema = z.object({
  q: z.string().catch(''),
  sort: z.string().catch(''),
  dir: z.enum(['asc', 'desc']).catch('asc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(200).catch(50),
});
```

Derived, without duplication:

- `defaultListQuery = listQuerySchema.parse({})` — defaults come _from_ the
  schema, so there is a single source of truth.
- `parseListQuery(params)` turns `URLSearchParams` into a valid `ListQuery`.
- `serializeListQuery(query)` writes the params back, **omitting every
  value equal to its default**, keeping URLs short and shareable
  (`/` instead of `/?q=&dir=asc&page=1&...`).

## Consequences

- A malformed or stale URL **never crashes** the app — bad fields
  fall back to defaults field by field.
- `ListQuery` is derived from the schema (`z.infer`), so the type and the
  runtime validation cannot drift apart.
- Canonical, minimal URLs, because defaults are stripped on serialization.
- Coercion is deliberate (`z.coerce.number`) — string params become
  typed numbers with enforced bounds (`min`/`max`).

## Alternatives considered

- **Hand-parsing `URLSearchParams`.** Verbose and error-prone; no
  single place for defaults/bounds.
- **A throwing validator (e.g. bare `.parse` without `.catch`).** One bad URL
  becomes an error boundary; the opposite of what we want for
  shareable links.
- **TypeScript types only.** Types vanish at runtime; untrusted input requires
  _runtime_ validation.
