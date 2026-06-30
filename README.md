# Scaffold

Production-grade boilerplate for a **data-heavy React app** with **URL-driven
state**. TypeScript (strict), Vite, Redux Toolkit + RTK Query + reselect,
React Router v7, and a recommended path to list virtualization — wired together
with performance and best practices in mind.

## Stack

| Concern            | Choice                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Build / dev server | **Vite 6** (`@vitejs/plugin-react-swc`)                                                  |
| Language           | **TypeScript** (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`)              |
| State              | **Redux Toolkit** + **reselect**                                                         |
| Server state       | **RTK Query** (one `baseApi`, injected endpoints)                                        |
| Routing            | **React Router v7**                                                                      |
| URL ↔ state        | URL is the source of truth, mirrored into Redux via **listener-style sync** + middleware |
| Validation         | **Zod** (total parsing of search params)                                                 |
| Large lists        | **Virtualization** — recommended pattern (`@tanstack/react-virtual`), not bundled        |
| Testing            | **Vitest** + Testing Library                                                             |
| Quality gates      | **ESLint** + **Prettier** + **Husky** + **lint-staged**                                  |
| UI library         | **Not included** — see [`src/ui`](src/ui/README.md)                                      |

## Architecture: URL-driven state

The core idea — **the URL is the single source of truth** for queryable view
state (search, filters, sort, pagination):

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

Why this shape:

- **One-directional sync (URL → store).** Writes go through `setQuery` →
  `setSearchParams`; the URL change flows back into Redux. No two-way binding,
  so no sync loops.
- **Zod makes parsing total.** A hand-edited or stale URL can never crash the
  app — each field `.catch()`es to a default. Defaults are omitted on
  serialize, so URLs stay short and shareable.
- **The mirror exists for Redux power-ups:** reselect selectors can combine URL
  state with cache/UI state, and listener middleware can react to URL changes
  (here: prefetch the next page).
- **No flash on deep links:** `main.tsx` preloads the mirror from
  `window.location` before the first render.

## Performance notes

- **Row virtualization** is a recommended pattern for large lists: add
  `@tanstack/react-virtual` to keep DOM size O(viewport), combined with the
  **server-side pagination** already carried by the query (`page`/`pageSize`).
- **reselect** selectors return stable references → fewer re-renders.
- **Shallow-equality guard** in `UrlStateSync` avoids redundant dispatches.
- **RTK Query** dedupes/caches per query arg; the listener **prefetches** the
  next page for instant paging.
- **Manual vendor chunks** (`vite.config.ts`) for long-lived browser caching.
- SWC-based React plugin for fast dev/HMR.

## Project layout

```
src/
├─ app/                 # store, typed hooks, listener middleware, root reducer
├─ api/                 # baseApi (RTK Query root)
├─ features/            # urlState/ — and your own features
│  └─ urlState/         # generic Zod list-query schema, slice mirror, selectors, sync, write hook
├─ ui/                  # SEAM for your internal UI library (placeholders only)
├─ routes/              # router, layout, pages
├─ styles/              # global css
└─ test/                # renderWithProviders helper
```

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm test           # run unit/component tests
npm run typecheck  # tsc project build (no emit)
npm run lint       # eslint
npm run build      # type-check + production build
```

> Uses **npm** with a committed `package-lock.json`. The Node version is pinned
> via `.nvmrc` and `engines.node`.

## Adding a feature

Create `src/features/<name>/` and wire it into the existing seams:

```ts
// inject an endpoint onto the shared baseApi
export const xApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getX: build.query({ query: (q) => ({ url: 'x', params: q }) }),
  }),
});
```

Read the URL-driven query state via `selectListQuery` (selector) or
`useListQueryState` (write hook), and set `VITE_API_BASE_URL` (see
`.env.example`) to point at your backend.

## Plugging in your UI library

This scaffold deliberately ships **no external UI library**. Everything imports
from `@/ui`, a thin placeholder layer. Point those exports at your internal
organization components (keeping the prop contracts) and the rest of the app is
untouched. See [`src/ui/README.md`](src/ui/README.md).
