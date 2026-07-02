# ADR 0007 — Redux Toolkit + RTK Query for state and cache

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

We have two different kinds of state: a small amount of **client-side view
state** (the URL mirror) and **server state** (paginated items) that needs
caching, deduplication, invalidation, and prefetching. We want one coherent
store, typed end to end, without hand-writing fetch/cache logic.

## Decision

We use **Redux Toolkit** for the store and **RTK Query** for server state.

- A single store factory, [`makeStore`](../../src/app/store.ts), composes the
  root reducer and middleware. A **factory** (rather than a mere singleton)
  makes tests hermetic and leaves the door open to SSR. Middleware order is
  deliberate: `listenerMiddleware` is **prepended** (runs first), and
  `baseApi.middleware` is added via concat.
- **One RTK Query API instance**, [`baseApi`](../../src/api/baseApi.ts), owns
  `reducerPath: 'api'`, shared `tagTypes`, and `keepUnusedDataFor`. Features
  **inject** their endpoints via `baseApi.injectEndpoints(...)`, so each feature
  is self-contained and chunk-splittable.
- [`rootReducer`](../../src/app/rootReducer.ts) wires up `[baseApi.reducerPath]`
  and the `urlState` slice.
- Typed hooks (`useAppSelector`, `useAppDispatch`, `useAppStore`) centralize the
  `RootState`/`AppDispatch` types, so components never import raw Redux types.

Cache invalidation is tag-based. `baseApi.tagTypes` starts empty (`[]`); tag
types are registered centrally as features add endpoints. For example, a list
query might provide a per-row tag plus a `LIST` tag, so a future mutation
invalidates precisely.

## Consequences

- Server-cache concerns (dedup, cache lifetime, refetch on focus/reconnect via
  `setupListeners`, invalidation) are handled by RTK Query, not custom code.
- Injected endpoints keep features modular and lazy-loadable.
- A single `baseApi` centralizes tag coordination across features.
- Some boilerplate/ceremony around typing the store — paid once, in `src/app`.

## Alternatives considered

- **Redux core + manual thunks/cache.** Reinvents RTK Query, worse.
- **React Query + Zustand/Context.** An excellent combination, but two libraries
  and two mental models; RTK Query gives cache _and_ a Redux store (needed for
  the URL mirror, selectors, and listener middleware) in one.
- **Multiple `createApi` instances.** Loses centralized tag/cache coordination.
