# ADR 0031 — Customer summary read directly from RTK Query

- **Status:** Accepted
- **Date:** 2026-09-03
- **Supersedes:** [ADR 0029](0029-customer-summary-redux-mirror-slice.md)

## Context

ADR 0029 added a read-only Redux mirror (`customerSummary.slice.ts`, one
writer `CustomerSummarySync`, selectors) so views would read Redux instead of
RTK Query, to satisfy the task's literal acceptance criterion "Redux is the
source of truth for views." ADR 0029 itself already conceded RTK Query alone
meets every _functional_ goal — fetch once per customer, no duplicate
requests across tabs, cleared on customer change — and that the mirror
exists only for that external criterion, not a technical need.

On 2026-09-02 the task owner retired that acceptance criterion by product
decision (plan decision D3). With it gone, the mirror is one more layer
(slice, sync component, selectors, three tests, a `RootState` field) that
can diverge from the cache it only ever copies, for no remaining
requirement.

## Decision

RTK Query is the single owner of customer server state. There is no mirror
slice and no sync component.

`CustomerDetailLayout` calls `useGetCustomerSummaryQuery(id, {
selectFromResult: () => ({}) })` once per customer visit as the **lifetime
anchor**: it holds the subscription for the whole visit (every tab,
including the dashboard, which has no panel) but selects nothing from the
result, so cache transitions never re-render the layout's heading or tab
subtree — the role `CustomerSummarySync` played as a `null`-rendering leaf.
The summary panel and the CDD/CRS/FATCA view subscribe to the same cache key
independently and read the value themselves; RTK Query dedupes all three to
one request. The endpoint keeps `keepUnusedDataFor: 0`, so changing or
leaving the customer id still drops every subscriber and evicts the entry —
ADR 0029's "cleared on customer change" is unchanged.

**Review rule:** every consumer in `customerDetails/` reads **`currentData`
only**, never `data`. `data` keeps the previous argument's result until the
new one resolves, and on RTK Query 2.12 `isLoading` is also `false` in that
window (`buildHooks.ts:1574-1586`) — either would flash the previous
customer's summary after switching. `currentData` is argument-scoped and
`undefined` until this customer's request resolves.

**Error retry.** RTK Query does not retry a rejected `/summary` request on
its own; the entry stays `rejected`. A newly mounted subscriber (opening the
CDD tab, returning from the dashboard) re-subscribes to that entry and RTK
Query issues a fresh request, so the panel shows its loading block again
during the retry. This is intended, not a bug, and is pinned by one
integration test stubbing a 503 response.

## Consequences

- One state; nothing can diverge from RTK Query because nothing else stores
  a copy.
- Deleted: `customerSummary.slice.ts`, `CustomerSummarySync.tsx`,
  `customerSummary.selectors.ts`, `CustomerSummaryLoadStatus`, the
  `rootReducer.ts` entry, and their three tests. `RootState` no longer has a
  `customerSummary` field.
- Rendering `CustomerSummaryPanel` outside `CustomerDetailLayout` would
  refetch on every unmount instead of reusing the anchor — documented on the
  anchor, pinned by the integration test's request counter.
- A future `data`/`isLoading` read in this folder reintroduces the
  previous-customer flash; the panel test "never exposes a previous
  customer" exists to catch that regression.

## Alternatives considered

- **Keep the mirror slice (ADR 0029 as accepted).** Its only justification
  was the acceptance criterion product retired on 2026-09-02.
- **Read `data` instead of `currentData`.** Shows the previous customer's
  summary while the new request is in flight.
- **Drop `keepUnusedDataFor: 0` along with the mirror.** D3 removed the
  mirror, not the eviction contract; the post-switch `status ===
'uninitialized'` integration assertion depends on it.
