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
components. Feature endpoints send list queries to the backend, which owns
search, filtering, sorting, pagination, and page metadata.

An opt-in development preview may synchronously seed a transformed, default
query result into that same cache before React mounts. It never replaces the
endpoint or creates a parallel slice, and production builds exclude preview
profiles and fixtures.
→ [ADR 0007](../adr/0007-redux-toolkit-and-rtk-query.md),
[ADR 0028](../adr/0028-development-preview-data-through-rtk-query.md)

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

For configuration-driven tables, the feature container turns the validated URL
mirror into endpoint arguments, passes the RTK Query result to the table, and
handles search, filter, sort, and pagination callbacks through the URL-state
write API. Backend responses use a data-only endpoint contract and never carry
rendering instructions. The browser receives only the requested page and never
processes the complete collection.

Feature filters use readable `filter.<key>` search parameters. The shared URL
layer validates their generic syntax, and the owning feature validates its
domain values with Zod before deriving RTK Query arguments.

The customer-detail summary is an explicit server-state exception required by
that feature's contract: one layout-level RTK Query subscriber mirrors only the
active customer into a read-only Redux slice. Views read the identity-scoped
mirror, and the endpoint evicts its transport cache when the layout leaves, so
neither layer retains historical customers.
→ [ADR 0026](../adr/0026-extensible-feature-filters-in-list-urls.md),
[ADR 0029](../adr/0029-customer-summary-redux-mirror-slice.md)

### 5. Generic data tables

The generic table exported from `@/ui` is a presentational, vendor-neutral
contract implemented with PrimeReact behind the seam. Static typed frontend
configuration assigns a component to every primary cell and declares translated
headings. Expandable row details render only an ordered allowlist of typed row
fields with translated labels; response fields are never discovered or exposed
implicitly. Search, filters, sorting, and pagination stay in the URL, server
state stays in RTK Query, and transient expanded-row state stays local to the
table.
→ [ADR 0025](../adr/0025-configuration-driven-generic-data-tables.md)

### 6. UI seam — `src/ui`

Everything imports UI primitives from `@/ui`, a thin stub layer, so the
organization's internal UI library can be plugged in within a single folder
without touching feature code.

### 7. Routing — `src/routes`

React Router v6 exposes the URL/search params as observable state and provides
the `RootLayout` mount point for `UrlStateSync`. Navigation has three explicit
roles: `navigation.types.ts` contains contracts only,
`navigation.manifest.ts` contains the complete physical configuration, and
`resolveNavigation.ts` is the single pure pathname interpreter. There are no
parallel section or context configuration modules.

Each manifest section declares
`{ id, path, labelKey, defaultItem?, sidebar, context? }`. Its one optional
dynamic context is nested under the owning section and declares
`{ id, parameter, defaultItem?, ariaLabelKey, topBar, sidebar, breadcrumb? }`.
This structure makes URL ownership, an optional default contextual destination,
and supported cardinality explicit without duplicating them in route
components. The resolver produces the top bar, sidebar, breadcrumb, nested
route ancestry, and semantic route identity used by the Redux URL mirror.
Components do not repeat context selection or pathname matching.

The customer context combines a runtime id with recursive L2/L3 destinations.
Its surface policy keeps the application-wide top bar on **Customers** while
the sidebar uses the customer tree. It configures
`defaultItem: 'general-data'`, so the router redirects `/customers/:id` to the
manifest-derived `/customers/:id/general-data` path. Static section
destinations take precedence over the dynamic context, so `/customers/all`
cannot be mistaken for a customer id. Customer route segments remain canonical
English identifiers, while every visible label comes from i18n.

The router derives section and context paths, including configured default
redirects, from the manifest. Implemented pages and lazy loaders remain in
section-scoped, type-checked page-route modules and their separate registry.
Navigation metadata therefore remains independent of page components, domain
data, and Redux behavior.
→ [ADR 0020](../adr/0020-routing-react-router-v6-for-iwa-compatibility.md),
[ADR 0023](../adr/0023-configurable-navigation-icon-components.md),
[ADR 0024](../adr/0024-canonical-route-transitions-in-redux.md),
[ADR 0027](../adr/0027-section-scoped-lazy-page-route-modules.md),
[ADR 0030](../adr/0030-unified-configurable-navigation-manifest.md)

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
