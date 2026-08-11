# ADR 0028 — Development preview data through RTK Query

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

Feature pages must use the real backend in normal application runtime, and the
browser must not implement mock filtering, sorting, pagination, or totals.
Developers still need to inspect an initial data-heavy view when a local backend
is temporarily unavailable.

Putting fixture data in a component, a feature slice, or an environment-switched
endpoint would introduce a second server-state owner or a mock transport into
runtime code. Manually constructing RTK Query's internal `preloadedState.api`
shape would also couple the scaffold to private cache implementation details.

## Decision

We provide explicit, opt-in development preview profiles. The application may
select a profile with `VITE_PREVIEW_DATA_PROFILE` during `npm run dev`.

- The bootstrap checks both `import.meta.env.DEV` and the configured profile,
  then dynamically imports the preview composition root before mounting React.
- Each profile seeds already-transformed results with RTK Query's public,
  synchronous `upsertQueryEntries` API. It never writes the internal API state
  shape directly.
- The customer profile seeds only the default first-page query key. Its value is
  mapped through the same response adapter used by the endpoint.
- The profile retains a subscription to that fulfilled entry so it remains
  available if the developer opens the route later in the session. Registering
  the subscription does not fetch because the cache key is already fulfilled.
- The real endpoint remains unchanged. A different URL query, pagination,
  sorting, filtering, search, or an explicit refetch still calls the backend.
- Preview fixtures contain data only. They do not calculate dataset operations
  or select frontend components.
- The `DEV` guard and dynamic import form a hard production boundary: preview
  modules and fixtures must not appear in production artifacts, even if a local
  environment file contains the profile variable.
- Preview profiles are registered in one development-only composition root, so
  future pages can add independent seeders without feature-specific conditions
  in the application bootstrap.

## Consequences

- A developer can inspect the initial customer table without running the
  backend, while production and normal development retain the real HTTP path.
- Server data still has one Redux owner: the shared RTK Query cache. No customer
  slice or component fallback is introduced.
- The preview intentionally covers only configured initial cache entries; it is
  not an offline mode. Interactions that change the query require the backend.
- Fixtures must be maintained alongside response-contract changes and mapped
  before they are inserted because cache upserts do not run `transformResponse`.
- The development bootstrap waits for a small dynamic module only when a preview
  profile is explicitly enabled.

## Alternatives considered

- **Switch the endpoint to a JSON mock through an environment flag.** Rejected
  because it creates a second runtime transport and can drift from real HTTP
  behavior.
- **Add a customer slice with initial entities.** Rejected because RTK Query
  already owns customer server state and a second cache can become inconsistent.
- **Render fixture data as a component fallback after request failure.** Rejected
  because presentation would become responsible for transport policy and errors
  could be mistaken for live data.
- **Write `preloadedState.api` manually.** Rejected because RTK Query's internal
  state shape is not a public application contract.
- **Run a local mock server.** Useful for fully interactive offline development,
  but unnecessary for the narrower requirement of inspecting one initial view.
