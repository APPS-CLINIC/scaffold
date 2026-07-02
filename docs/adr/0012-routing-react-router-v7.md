# ADR 0012 — Routing with React Router v7

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

The "URL as source of truth" architecture
([ADR 0006](0006-url-as-single-source-of-truth.md)) depends on a router that
exposes the URL — both the path and the **search params** — as first-class,
observable state with hooks. We also want one place to mount cross-cutting
concerns (URL→store sync) and the layout shell.

## Decision

We use **React Router v7** with a browser router defined in
[`router.tsx`](../../src/routes/router.tsx):

- A `RootLayout` element wraps all routes and is where
  [`UrlStateSync`](../../src/features/urlState/UrlStateSync.tsx) mounts once.
- Routes: the index renders `HomePage` (placeholder), and `*` renders
  `NotFoundPage`.
- Features read/write search params via the router's `useSearchParams` (wrapped
  by `useListQueryState`), which is the backbone of the URL-driven state pattern.

## Consequences

- Search params are observable React state, enabling one-directional URL→store
  sync and shareable links.
- `RootLayout` gives a single mount point for app-wide concerns (sync today;
  error boundaries, chrome, etc. later).
- Coupled to the React Router API; the test helper `renderWithProviders` wires
  the router, so components using router hooks are testable.

## Alternatives considered

- **TanStack Router.** A strong, type-safe routing/search-params story; React
  Router v7 was chosen as the default, less-opinionated, widely known option for
  this scaffold.
- **No router / manual `history`.** Re-implements search-param observation and
  navigation the router already provides.
