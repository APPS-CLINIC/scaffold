# ADR 0006 — URL as the single source of truth for view state

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

For a data-heavy list view, the "queryable" view state — search text,
filters, sorting (field/direction), pagination — must be **shareable,
bookmarkable, and survive a reload**. If this state lives only in component
state or in Redux, a copied link loses it, and the back button does the
wrong thing.

## Decision

We make the **URL the single source of truth** for queryable view state, with a
strictly **one-way** flow into Redux:

```
 write                                read
 useListQueryState.setQuery(...)       useAppSelector(selectListQuery)
        │                                        ▲
        ▼                                        │
 setSearchParams ─▶ React Router URL ─▶ <UrlStateSync/> ─▶ urlState slice (mirror)
```

- **Writes** go through `useListQueryState().setQuery()`
  ([`useListQueryState.ts`](../../src/features/urlState/useListQueryState.ts)),
  which serializes to search params via `setSearchParams`.
- A URL change comes back through
  [`UrlStateSync`](../../src/features/urlState/UrlStateSync.tsx) — mounted
  once in the root layout — which parses the params and mirrors them into the
  `urlState` slice.
- **Reads** happen from the mirror via reselect selectors (see
  [ADR 0009](0009-reselect-and-listener-middleware.md)).

**There is no two-way binding**: the store never writes back to the URL,
so there is no synchronization loop.

To avoid a flash of default state on deep links, `main.tsx` seeds the
mirror from `window.location` _before_ the first render.

## Consequences

- Every view is a shareable, reloadable link; back/forward buttons
  "just work".
- One direction of data flow → no feedback loops, easy to reason about.
- The mirror enables Redux "power-ups" (selectors combining URL state with
  cache/UI state; listener middleware reacting to URL changes — e.g. prefetch).
- A small indirection: a write is "navigate, then observe", not a direct
  state set. The guard in `UrlStateSync` (shallow comparison) keeps this
  cheap.

## Alternatives considered

- **State only in Redux/component.** Loses shareability, reload, and
  history.
- **Two-way URL↔store binding.** Invites synchronization loops and
  ambiguous ownership.
- **Router loaders as the only state.** Works, but the Redux mirror is what
  lets selectors/middleware combine URL state with cache and UI state.
