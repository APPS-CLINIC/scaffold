# ADR 0022 — Typed frontend manifest for contextual navigation

- **Status:** Superseded by ADR-0023
- **Date:** 2026-07-20

## Context

The application has a primary IWA tab menu and needs a desktop contextual
sidebar whose items depend on the active top-level section. Navigation must be
easy to extend without duplicating paths across React Router, the top bar, the
sidebar, redirect logic, and active-state calculations.

IWA `MenuList` controls selection by array index, while route identity must stay
stable when items are reordered or filtered by permissions. The supplied JSON
examples also contain serialized React nodes (`key`, `ref`, and `props`), which
are not a portable or maintainable application configuration format.

The existing architecture already makes the URL the source of truth and uses
typed frontend i18n keys for static interface labels.

## Decision

We keep navigation configuration as a typed, static frontend manifest under
`src/routes/navigation`:

- Each top-level section declares a stable key, root path, i18n label, optional
  default item, and a flat list of contextual items.
- Each contextual item declares a stable ID, relative path segment, i18n label,
  optional icon key, matching mode, and optional permission requirements.
- Helpers derive full paths, default destinations, active sections, and active
  items. The router, IWA top tabs, and IWA sidebar consume those derived values.
- Section roots with contextual items redirect to their declared default item.
- The URL pathname determines the active section and item. IWA's numeric
  `selectedIndex` exists only inside a thin `@/ui` adapter and is never stored as
  application state.
- Visual navigation is composed from ready-made IWA `NavigationPanel`,
  `MenuList`, and icon components. Local code supplies layout, routing, and
  stable-ID adaptation but does not implement a competing menu component.
- Static labels stay in the typed PL/EN catalogs. Icons are referenced through
  a central key registry rather than embedded as serialized React elements.
- Sidebar collapse is a desktop UI preference stored locally; it is not part of
  the shareable URL state.

## Consequences

- Adding a flat contextual destination requires one item declaration and its
  translations; selection and full paths are not wired manually elsewhere.
- Reordering or permission-filtering items does not change their identity.
- Deep links, reloads, and browser history reconstruct both navigation levels.
- React Router route elements remain frontend code and cannot be supplied by a
  runtime JSON response.
- The private IWA package types and visuals must be verified in an environment
  with registry access. We do not create a custom visual fallback when that
  registry is unavailable.
- A future nested menu would require a separate component and architecture
  decision; the current manifest intentionally models one contextual level.

## Alternatives considered

- **Separate route, top-tab, and sidebar arrays.** Rejected because paths,
  labels, and ordering drift as the application grows.
- **Persist the IWA selected index in component or Redux state.** Rejected
  because indexes are unstable and can diverge from direct URL navigation.
- **Store React elements in JSON.** Rejected because React nodes are not a
  serializable configuration contract and couple data to rendering internals.
- **Load the entire route tree from an API.** Rejected for the current static
  frontend scope; the backend cannot safely provide React route components.
- **Build a custom sidebar.** Rejected because IWA is the accepted UI library
  behind the application seam.
