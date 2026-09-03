# ADR 0029 — Customer summary as a read-only Redux mirror slice

- **Status:** Superseded by ADR-0031
- **Date:** 2026-08-31

## Context

The customer master-data panel (`/customers/{id}/...`) must fetch
`GET /api/v1/customers/{id}/summary` once per customer, keep it available
across every tab without refetching, and clear it when the user leaves the
customer or switches to a different one. The task's own acceptance criteria
require Redux to be "the source of truth for views" for this data, with RTK
Query limited to HTTP caching — and explicitly call out the risk of two
divergent states (RTK Query cache vs. a hand-rolled store).

ADR 0028 already rejects "a customer slice with initial entities" as an
alternative to RTK Query, in the narrower context of seeding **development
preview fixtures**: "RTK Query already owns customer server state and a
second cache can become inconsistent." That decision stands for preview data.
It does not, on its own, cover a production Redux slice that never fetches
anything itself and only mirrors an existing RTK Query result — which is a
different shape of risk than a second, independently-fetched cache.

## Decision

Add `customerSummary.slice.ts`: `{ customerId, data, status }`, with exactly
two actions (`customerSummaryChanged`, `customerSummaryCleared`) and exactly
one writer, `CustomerSummarySync` — a no-UI component mounted once per
customer identity by `CustomerDetailLayout`. The status is one of `idle`,
`loading`, `succeeded`, or `failed`, so views do not need a second RTK Query
subscription to render their lifecycle.

`CustomerSummarySync` subscribes to
`useGetCustomerSummaryQuery(customerId)`. RTK Query still owns the actual HTTP
fetch and its in-flight deduplication, so switching tabs within a customer
keeps one subscription and never refetches. The endpoint sets
`keepUnusedDataFor: 0`: when that layout subscription leaves, the transport
cache entry is removed instead of retaining historical customers. The mirror
is cleared on layout exit and replaced with the next customer's loading state
when identity changes.

Both reducer transitions and selectors are scoped by `customerId`. Cleanup or
a response from an obsolete subscription cannot erase or replace the active
customer, and a view can never expose data whose stored identity differs from
the identity in the URL.

This is the same shape as the existing `urlState` mirror
(`src/features/urlState/urlState.slice.ts`, `UrlStateSync.tsx`, ADR 0024):
external state (there, the URL; here, an RTK Query result) is dispatched
into a slice by exactly one component, so views can select from Redux
without ever writing to it directly, and the mirror cannot diverge from its
source because there is nowhere else for a write to come from.

## Consequences

- Redux is the source of truth for every view that reads customer-summary
  data (this panel today; the CDD/CRS/FATCA section's shared presentational
  component later), satisfying the task's explicit requirement.
- There is still exactly one thing that talks to the backend: RTK Query. The
  slice cannot become a second, independently-fetched cache — it has no code
  path that fetches anything, only a subscription that mirrors what RTK
  Query already resolved.
- Redux and the RTK Query cache each retain at most the active customer's
  summary. Returning after leaving that customer starts a new request rather
  than reviving historical data.
- `CustomerSummarySync` must stay the only file that dispatches
  `customerSummaryChanged`/`customerSummaryCleared`. A future feature that
  wants customer-summary data reads the selector; it does not add a second
  writer.

## Alternatives considered

- **RTK Query only, no slice.** Rejected for this task specifically: it
  meets the functional goals (fetch once, no duplicate requests, effectively
  cleared on customer change via the cache key) but not the literal
  requirement that Redux be the source of truth for the view layer.
- **Extend ADR 0028's rejected "customer slice with initial entities."**
  Not applicable here — that alternative was a slice seeded with its own
  fixture data as a fallback path, i.e. a second thing that could disagree
  with RTK Query. This slice has no such path; it is a strict, single-writer
  mirror of RTK Query's own result.
