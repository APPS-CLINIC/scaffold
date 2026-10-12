# ADR 0038 — List filters as service-named URL params

- **Status:** Accepted
- **Date:** 2026-10-05
- **Refines:** [ADR 0026](0026-extensible-feature-filters-in-list-urls.md); replaces
  its `filter.<key>` naming

## Context

[ADR 0026](0026-extensible-feature-filters-in-list-urls.md) gave each list
filter one `filter.<key>=<value>` param of at most 200 characters. The customer
list now filters by several values of one field at once (statuses, the sixteen
customer types, groups and advisors) and by date ranges with open ends. The
service reads these as repeated array params (`status=ACTIVE&status=ARCHIVAL`)
and as `<field>.from` / `<field>.to` dates. One prefixed string per key can hold
neither, and the `filter.` prefix makes shared links read like an internal
format rather than the list's own address.

## Decision

- Every search param other than the list query's own (`q`, `sort`, `dir`,
  `page`, `pageSize`) is a filter param. A filter is named like the service param
  it becomes: `?status=ACTIVE&status=ARCHIVAL&lendingReviewDate.to=2026-10-01`.
  A name may have one dotted part, such as `.from` or `.to`.
- `ListQuery.filters` is a `Record<string, string[]>`: each value is its own
  repeated param.
- Parsing stays total. Each value is trimmed and checked on its own (1–200 characters) and
  dropped alone when invalid, so one bad value never discards the rest of the
  choice. The list's own params are never read as filters, and a filter cannot
  take their names.
- The values of a param are kept **canonical**: without duplicates, sorted, and
  capped at 100 (`MAX_FILTER_VALUES`). Equal choices therefore produce the same
  URL, the same mirrored query and the same RTK Query cache key, whatever order
  the user picked them in. A param with no valid value disappears.
- Serialization writes the same canonical lists, after the list's own params.
  Filter equality compares the lists value by value, so reparsing an unchanged
  URL never dispatches.
- The owning feature still validates its params with its own Zod schema (ADR
  0026). Params it does not know — another feature's, or tracking params such as
  `utm_source` — stay in the URL, because an owner that writes `filters` keeps
  the params it does not own, and they never reach its endpoint.

## Consequences

- A list URL reads like the service request it causes, and a multi-value filter
  maps one-to-one onto the service's array params.
- Order is not meaningful in a filter. A feature that needs an ordered list
  cannot store it as a filter param.
- Choosing more than 100 values of one param keeps only the first 100 in sort
  order. Controls that can produce more limit the selection themselves.
- Links with the old `filter.<key>` params no longer filter.
- Any unknown param on a list route counts as a filter for generic checks such
  as `selectListIsFiltered`; only a feature's schema decides what applies.

## Alternatives considered

- **Keep the `filter.` prefix.** Rejected: it guards against name clashes that
  a short list of reserved names prevents just as well, and it makes every
  shared link look like an internal format.
- **A comma-separated list in one value.** Rejected: the 200-character bound
  breaks with ordinary choices, a value could contain the separator, and an
  encoded comma (`%2C`) makes URLs harder to read.
- **A date range as one value such as `from..to`.** Rejected: it needs its own
  grammar for open ends and does not match the service's `.from` / `.to` params.
- **Keeping the user's order.** Rejected: two links to the same filtered view
  would differ and miss each other's cache entries.
