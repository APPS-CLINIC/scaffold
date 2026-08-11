# ADR 0026 — Extensible feature filters in list URLs

- **Status:** Accepted
- **Date:** 2026-08-04
- **Supersedes:** [ADR 0008](0008-zod-total-parsing-of-search-params.md)

## Context

[ADR 0008](0008-zod-total-parsing-of-search-params.md) established total Zod
parsing for a fixed list query containing search, sort, direction, page, and
page size. Data-heavy feature pages also need domain-specific filters, but
putting every feature field into the shared schema would couple unrelated
screens and turn the generic URL layer into a product schema.

The first customer endpoint uses a Spring-style request with zero-based
`page`, a default `size` of 10, and feature filters such as customer status and
sector. Those values must remain shareable and restorable from the URL while
malformed or stale links remain safe.

## Decision

We retain total Zod parsing, 1-based application pages, canonical serialization,
and the URL as the single source of truth from ADR 0008, with these extensions:

- `ListQuery` includes a generic `filters: Record<string, string>` value.
- Feature filters serialize as `filter.<key>=<value>`. Generic parsing accepts
  only bounded keys beginning with a lowercase letter and containing letters,
  numbers, underscores, or hyphens; values are also length-bounded. Invalid or
  empty entries are omitted.
- The owning feature applies a second Zod schema to its recognized filter keys
  before constructing RTK Query arguments. Unknown generic keys may remain in
  the URL but cannot enter a feature endpoint contract without validation.
- URL equality compares filter entries by value rather than record identity,
  preventing synchronization loops when the same parameters are reparsed.
- The shared default page size is 10, matching the initial customer service
  contract. Like every default, it is omitted from canonical URLs.
- The Redux URL mirror is initialized from the browser location before the
  first React render. A deep link therefore cannot trigger an initial request
  with defaults before synchronization catches up.
- Backend adapters convert the validated 1-based application page to any
  service-specific indexing convention and allowlist sortable fields before
  sending request parameters.

## Consequences

- New list features can add namespaced URL filters without changing the shared
  list-query shape for every domain.
- Shared links restore search, filters, sorting, and pagination before the first
  RTK Query subscription is created.
- Generic syntax validation and feature-level domain validation remain separate,
  so extensibility does not weaken endpoint input handling.
- A filter key that belongs to another feature is preserved when customer-owned
  filters change.
- Changing the shared default from 50 to 10 changes which `pageSize` value is
  omitted from canonical URLs; explicit values continue to round-trip.

## Alternatives considered

- **Add customer fields directly to `listQuerySchema`.** Rejected because the
  shared URL layer would accumulate domain knowledge for every list screen.
- **Store filters only in component or Redux state.** Rejected because reloads,
  browser navigation, and shared links would lose the active view.
- **Accept arbitrary filter keys and values without bounds.** Rejected because
  search parameters are untrusted input and still need total, constrained
  parsing at the shared boundary.
- **Dispatch defaults first and synchronize after mount.** Rejected because a
  deep link can issue the wrong initial request and briefly render stale data.
- **Send any URL sort field to the backend.** Rejected because sortable fields
  are an endpoint-specific allowlist, not arbitrary user input.
