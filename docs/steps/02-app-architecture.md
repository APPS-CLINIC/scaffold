# Step 02 — Application architecture

> **Goal:** document the runtime architecture that sits on the configuration
> layer from [Step 01](01-scaffold-and-config.md).

This step explains _how the app is wired at runtime_: where state lives, how the
URL drives the view, how server data is fetched and cached, and how the UI stays
swappable. Each section links to the ADR that records the decision.

## The core idea: the URL drives everything

```
        write                              read
 ┌───────────────────┐             ┌─────────────────────┐
 │ useListQueryState │  navigate → │  React Router (URL)  │
 │   setQuery(...)   │             └──────────┬──────────┘
 └───────────────────┘                        │ search params change
                                              ▼
                                   ┌─────────────────────┐
                                   │   <UrlStateSync/>    │  (URL → Redux, guarded)
                                   └──────────┬──────────┘
                                              ▼
                                   urlState slice (mirror)
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                            ▼                           ▼
        selectListQuery (reselect)    listener middleware           components read
                  │                   (prefetch next page)          via useAppSelector
                  ▼
        useGetXQuery(query)  →  RTK Query cache  →  render
```

**The URL is the single source of truth** for queryable view state; Redux holds
a one-directional **mirror** of it. See
[ADR 0006](../adr/0006-url-as-single-source-of-truth.md).

## Layer by layer

### 1. Store and data layer — `src/app`, `src/api`

One store factory (`makeStore`) composes the root reducer and middleware; one
`baseApi` RTK Query instance owns the server-state cache, and features inject
their endpoints into it. Typed hooks hide the raw Redux types from components.
→ [ADR 0007](../adr/0007-redux-toolkit-and-rtk-query.md)

### 2. URL state — `src/features/urlState`

Zod parses search params **totally** (every field `.catch()`es to a default), so
a bad URL never breaks the view; defaults are dropped on serialize for short,
shareable links. `UrlStateSync` mirrors URL→store one-directionally;
`useListQueryState` is the write side.
→ [ADR 0008](../adr/0008-zod-total-parsing-of-search-params.md),
[ADR 0006](../adr/0006-url-as-single-source-of-truth.md)

### 3. Derived reads and side effects — selectors + listeners

reselect selectors give stable, memoized reads (fewer re-renders); listener
middleware runs reactive side effects — here **prefetching the next page** on
query change — without thunks in components.
→ [ADR 0009](../adr/0009-reselect-and-listener-middleware.md)

### 4. Adding a feature

You add a new feature as a folder in `src/features/<name>/`. The feature
**injects** its endpoint via `baseApi.injectEndpoints(...)` (with tag-based cache
invalidation), **reads** the query state from the URL via `selectListQuery` /
`useListQueryState`, and — if it renders a large list — optionally
**virtualizes** it (server-side pagination carried by `page`/`pageSize` in
`listQuerySchema`).

### 5. UI seam — `src/ui`

Everything imports UI primitives from `@/ui`, a thin placeholder layer, so the
organization's internal UI library can be plugged in from a single folder without
touching feature code.

### 6. Routing — `src/routes`

React Router v7 exposes the URL/search params as observable state and provides a
mount point in `RootLayout` for `UrlStateSync`.
→ [ADR 0012](../adr/0012-routing-react-router-v7.md)

## How a single interaction flows

1. The user types in the search field → `setQuery({ q })` (debounced, `replace`),
   which resets `page` to 1 and calls `setSearchParams`.
2. The URL changes → `UrlStateSync` parses it and, if different (shallow-compare
   guard), dispatches to the `urlState` mirror.
3. `selectListQuery` recomputes; the feature's query hook fetches data (or serves
   from cache); an optional listener may prefetch the next page.
4. The component renders the results — for large lists, optionally only the
   visible rows (virtualization).

## Verifying the step

Because the architecture is exercised by the test suite, the same gates from
[Step 01](01-scaffold-and-config.md) validate it:

```bash
npm test          # schema parsing, URL→store sync, selectors, etc.
npm run typecheck # end-to-end types: store, query, selectors
npm run build     # production build
```

## Process

This step lands as a `docs/app-architecture` branch, on top of Step 01, via
Pull Request — see [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
