# Step 02 — Application architecture

> **Goal:** document the runtime architecture that sits on top of the
> configuration layer from [Step 01](01-scaffold-and-config.md).

This step explains _how the application is wired at runtime_: where state
lives, how the URL drives the view, how server data is fetched and cached, and
how the UI stays swappable. Each section links to the ADR recording the
decision.

## Core idea: the URL drives everything

```
        write                               read
 ┌───────────────────┐             ┌─────────────────────┐
 │ useListQueryState │  navigate → │  React Router (URL)  │
 │   setQuery(...)   │             └──────────┬──────────┘
 └───────────────────┘                        │ search params change
                                              ▼
                                   ┌─────────────────────┐
                                   │   <UrlStateSync/>    │  (URL → Redux, with guards)
                                   └──────────┬──────────┘
                                              ▼
                                   urlState slice (route + query mirror)
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                            ▼                           ▼
        selectListQuery (reselect)    listener middleware           components read
                  │                   (prefetch of the next page)    via useAppSelector
                  ▼
        useGetXQuery(query)  →  RTK Query cache  →  render
```

**The URL is the single source of truth** for route and queryable view state;
Redux holds a one-way **mirror** of that state. Every distinct content pathname
emits `routeChanged`, while validated query changes use their feature-specific
actions. See [ADR 0006](../adr/0006-url-as-single-source-of-truth.md) and
[ADR 0024](../adr/0024-canonical-route-transitions-in-redux.md).

## Layer by layer

### 1. Store and data layer — `src/app`, `src/api`

A single store factory (`makeStore`) composes the root reducer and middleware;
a single RTK Query `baseApi` instance owns the server-state cache, and features
inject their endpoints into it. Typed hooks hide the raw Redux types from
components.
→ [ADR 0007](../adr/0007-redux-toolkit-and-rtk-query.md)

### 2. URL state — `src/features/urlState`

Zod parses the search params **totally** (every field `.catch()` with a
default), so a bad URL never breaks the view; defaults are stripped at
serialization for short, shareable links. `UrlStateSync` mirrors URL→store
one-way: `routeChanged` carries the full pathname plus derived section/item IDs,
while `listQueryChanged` carries validated list parameters.
→ [ADR 0008](../adr/0008-zod-total-parsing-of-search-params.md),
[ADR 0006](../adr/0006-url-as-single-source-of-truth.md)

### 3. Derived reads and side effects — selectors + listeners

Reselect selectors provide stable, memoized reads (fewer re-renders); listener
middleware runs reactive side effects — here, **prefetching the next page**
when the query changes — without thunks in components.
→ [ADR 0009](../adr/0009-reselect-and-listener-middleware.md)

### 4. Adding a feature

You add a new feature as a folder in `src/features/<name>/`. The feature
**injects** its endpoint via `baseApi.injectEndpoints(...)` (with tag-based
cache invalidation), **reads** query state from the URL via
`selectListQuery` / `useListQueryState`, and if it renders a large list —
optionally **virtualizes** it (server-side pagination carried by
`page`/`pageSize` in `listQuerySchema`).

### 5. UI seam — `src/ui`

Everything imports UI primitives from `@/ui`, a thin stub layer, so the
organization's internal UI library can be plugged in within a single folder
without touching feature code.

### 6. Routing — `src/routes`

React Router v6 exposes the URL/search params as observable state and provides
the `RootLayout` mount point for `UrlStateSync`. A typed frontend navigation
manifest supplies the top tabs, contextual IWA menu, default redirects, and
pathname matching without storing positional menu indexes.
→ [ADR 0020](../adr/0020-routing-react-router-v6-for-iwa-compatibility.md),
[ADR 0023](../adr/0023-configurable-navigation-icon-components.md),
[ADR 0024](../adr/0024-canonical-route-transitions-in-redux.md)

## How a single interaction flows

1. The user types into the search field → `setQuery({ q })` (debounced,
   `replace`), which resets `page` to 1 and calls `setSearchParams`.
2. The URL changes → `UrlStateSync` parses it and dispatches `routeChanged` for
   a new pathname and/or the relevant typed query action for changed search
   parameters.
3. `selectListQuery` recomputes; the feature's query hook fetches the data
   (or serves it from cache); an optional listener may prefetch the next page.
4. The component renders the results — for large lists, optionally only the
   visible rows (virtualization).

## Verifying this step

Since the architecture is exercised by the test suite, the same gates from
[Step 01](01-scaffold-and-config.md) validate it:

```bash
npm test          # schema parsing, URL→store sync, selectors, etc.
npm run typecheck # end-to-end types: store, query, selectors
npm run build     # production build
```

## Process

This step lands as the `docs/app-architecture` branch, on top of Step 01, via a
Pull Request — see [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
