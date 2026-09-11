# ADR 0030 — Unified configurable navigation manifest

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

[ADR 0023](0023-configurable-navigation-icon-components.md) established a
typed, URL-driven manifest for global navigation. Customer details add a
different navigation depth beneath the same **Customers** section: the global
top bar must stay unchanged, while the sidebar becomes a recursive customer
tree whose active ancestry survives direct L3+ links. The customer shell also
needs a configurable landing item, breadcrumb ownership, and a dynamic entity
identifier in every generated path.

Keeping separate global and customer manifests made the editing location hard
to discover and forced consumers to choose between domain-specific resolver
helpers. It also allowed the router, sidebar, breadcrumb, and Redux URL mirror
to interpret the same pathname differently. The application is small enough
that one obvious configuration location is more valuable than distributed
feature-owned fragments.

## Decision

Use `src/routes/navigation/navigation.manifest.ts` as the single physical
source of application navigation values. Keep contracts in
`navigation.types.ts` and interpret the manifest through the pure
`resolveNavigation(pathname)` function; neither file duplicates application
configuration.

Each global section declares its stable `id`, canonical path, i18n label,
optional default item, and sidebar. A section may additionally declare one
dynamic `context`, nested directly beneath its owner. The context declares its
parameter name, independent top-bar policy, optional default item, contextual
sidebar, breadcrumb root, and stable i18n metadata.

The manifest supports two explicit sidebar shapes:

- `list` is a compile-time flat list rendered through the IWA menu adapter;
- `tree` is recursive and rendered through IWA `NavigationMenuItem`, including
  active ancestors and URL-derived default expansion.

The context top-bar policy is either `global` or `context`. Customer details
currently use `global`, so `/customers/all` and every
`/customers/:id/...` route keep the same application-wide top tabs with
**Customers** active. Only the sidebar changes to the seven configured customer
destinations. The customer context sets `defaultItem: 'general-data'`, making a
bare `/customers/:id` route redirect with `replace` to the manifest-derived
`general-data` destination.

Resolution and generated routes follow the same rules:

- static section items take precedence over the dynamic context, so
  `/customers/all` is never interpreted as a customer identifier;
- matching is case-sensitive and segment-boundary aware;
- an L3+ route retains its deepest configured ancestry and unmatched segments;
- one shared recursive route builder handles both section and context trees;
- page components and lazy loaders stay in the section page-route registry,
  outside navigation configuration;
- all path segments are stable English identifiers, while every visible label
  comes from the English or Polish i18n catalog.

`resolveNavigation` returns complete presentation models for the top bar,
sidebar, breadcrumb, and route identity. Renderers and the Redux URL mirror
consume those models without customer-specific pathname branches. Runtime
domain values such as the customer name are joined only by the owning view.
The URL remains the source of truth for active selection, deep links, and
browser history.

## Consequences

- A developer can inspect and change all navigation structure and surface
  policies in one intuitive file.
- The top bar, sidebar, router, breadcrumb, and Redux mirror cannot select
  competing configuration sources.
- Adding or reordering a customer tab, changing its default, or adding a nested
  destination is primarily a manifest change plus an optional page-loader
  registration.
- The manifest is larger and may become a merge hotspot as the application
  grows. Splitting ownership later requires a new decision and one retained
  public composition root.
- A section deliberately supports at most one dynamic context. Supporting
  several context kinds requires an explicit discriminator rather than array
  order.
- Context data and presentation state remain outside the manifest, keeping its
  resolver deterministic and its tests independent of React and Redux.

## Alternatives considered

- **Keep separate global and customer manifests.** Rejected because every
  consumer must repeat context selection and precedence rules.
- **Hardcode customer behavior in the top bar or sidebar.** Rejected because
  surface policy would be hidden in JSX and direct links could reconstruct a
  different state.
- **Store page components, API data, or Redux actions in the manifest.**
  Rejected because navigation metadata should not become an application or
  domain registry.
- **Allow several dynamic contexts in an array.** Rejected because the current
  URL topology has no discriminator that could select between them safely.
- **Localize route segments.** Rejected because switching language would
  invalidate copied links and browser history.
