# ADR 0009 — reselect selectors + listener middleware

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

Two recurring needs in a data-heavy app: (1) derive values from state **without
causing extra re-renders**, and (2) run **reactive side effects** (prefetch,
analytics, cross-slice coordination) **without scattering thunks across
components**.

## Decision

We use **reselect** for derived reads and Redux Toolkit's **listener
middleware** for reactive side effects.

- **reselect** selectors (`src/features/**/**.selectors.ts`) memoize derived
  state and return **stable references**, so selector subscribers re-render only
  when their slice of derived state actually changes. Components read the URL
  mirror through them rather than re-parsing.
- **Listener middleware** is configured once in
  [`listenerMiddleware.ts`](../../src/app/listenerMiddleware.ts) with typed
  helpers (`startAppListening` / `addAppListener`). Features register their own
  listeners via a **side-effect import** in
  [`store.ts`](../../src/app/store.ts). A typical per-feature pattern is a
  listener that **prefetches the next page** on query change, so pagination is
  instant.
- The middleware is **prepended** before the API middleware (see
  [ADR 0007](0007-redux-toolkit-and-rtk-query.md)), so it observes actions
  first.

## Consequences

- Fewer re-renders: stable selector outputs + the shallow-comparison guard in
  `UrlStateSync` keep dispatch/render churn low.
- Side effects live in one idiomatic place (listeners) rather than scattered as
  thunks in components — easier to find, test, and reason about.
- The prefetch-on-change pattern gives instant pagination at the cost of extra
  requests (bounded by RTK Query's caching/dedup).
- Listeners register through a side-effect import that must stay in `store.ts`
  for them to attach.

## Alternatives considered

- **Inline `useMemo`/`useSelector` deriving in components.** Duplicated logic,
  unstable references, more re-renders.
- **Thunks / `useEffect` for side effects.** Scatters reactive logic across the
  component tree; harder to coordinate across slices.
- **Redux-Saga/Observable.** Powerful, but too heavy for this scale; listener
  middleware is RTK's native answer.
