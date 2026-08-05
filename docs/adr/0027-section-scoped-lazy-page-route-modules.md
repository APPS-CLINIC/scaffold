# ADR 0027 — Section-scoped lazy page route modules

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

The typed navigation manifest defines stable section and item identities and
derives the application's navigable paths. As real pages replace generated
placeholders, the router also needs to associate those identities with
route-level components.

Page-specific conditions in the root router do not scale beyond the first
implemented destination. A single registry containing every page import would
remove the conditions but would become a large merge hotspot and eagerly pull
unrelated features into the initial application bundle. Putting page components
in the navigation manifest would instead mix presentation metadata with route
composition and make every navigation consumer depend on application pages.

## Decision

We compose implemented navigation destinations from **section-scoped lazy page
route modules** under `src/routes/pageRoutes`:

- Each route-level page component lives in its own file under
  `src/routes/pages/<section>` and imports a feature only through that feature's
  public entry point.
- Each navigation section owns a `<section>.pageRoutes.ts` module that maps its
  configured item IDs to React Router `lazy` loaders.
- `SectionPageRoutes<TKey>` derives the allowed item IDs from the literal
  navigation manifest. Each section mapping uses `satisfies` so unknown or
  cross-section IDs fail type checking.
- `pageRouteRegistry.ts` is the route composition root. It contains one entry
  per implemented section, not one import per page.
- The root router asks the registry for a loader by stable section and item ID.
  It continues to derive paths through the navigation helpers and renders
  `SectionPage` for destinations without an implemented loader.
- Implemented pages use React Router's route-level `lazy` contract so their
  page and feature code is loaded only when that destination is visited.
- The navigation manifest remains metadata-only and does not import route pages
  or feature code.

## Consequences

- New pages are added within their owning section instead of expanding the root
  router or a global page-by-page registry.
- The composition root grows with implemented sections, while section modules
  absorb the larger number of individual pages and reduce merge conflicts.
- Stable navigation IDs and path derivation remain the single routing contract;
  an invalid page mapping is caught at compile time.
- Route-level code splitting keeps unrelated feature bundles out of the initial
  load.
- There is a small amount of explicit wiring per new section. This is preferred
  over convention-based discovery because imports, ownership, and code-split
  boundaries remain visible and testable.
- Routes that are not navigation destinations, such as entity detail routes,
  remain explicit React Router route objects and do not require artificial menu
  IDs.

## Alternatives considered

- **Keep page-specific conditions in `router.tsx`.** Rejected because the root
  router would accumulate domain knowledge and condition branches.
- **Keep every page in one central component registry.** Type-safe, but it
  becomes a page-level merge hotspot and eagerly imports every registered
  feature unless additional loading indirection is added.
- **Store page components or loaders in the navigation manifest.** Conveniently
  colocated, but it couples navigation UI consumers to route composition and
  feature modules.
- **Discover modules with `import.meta.glob`.** Reduces explicit wiring, but is
  Vite-specific, makes registration less visible, and weakens straightforward
  type checking and unit testing for the current application size.
