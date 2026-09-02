# Contextual Sidebar Navigation

This document describes the contextual desktop navigation introduced by the
`feat/contextual-sidebar-navigation` change, why the implementation has this
shape, and how to extend it safely.

## What changes

### One physical configuration and one interpreter

Navigation has three files with deliberately separate roles:

- `navigation.types.ts` contains contracts only. It defines the shape of the
  manifest and resolved models but contains no application navigation values.
- `navigation.manifest.ts` is the one physical editing location for the
  complete navigation: global sections, their sidebars, an optional nested
  context, default destinations, surface policies, breadcrumb metadata, icons,
  and fallback behavior.
- `resolveNavigation.ts` is the pure pathname interpreter. It derives paths,
  active ancestry, expanded branches, breadcrumbs, and the models consumed by
  every navigation surface.

An optional context is nested directly under the section that owns its URL
space. The customer context therefore lives inside the `customers` section,
and that structure expresses ownership without duplicated context data. Its
configuration owns `/customers/:id/...`, its seven L2 items and their recursive
descendants. Its `defaultItem` selects the contextual destination used when the
URL contains the customer ID but no tab segment.
`topBar: 'global'` keeps the application-wide top bar on **Customers**, while
the context's `tree` sidebar replaces the section's default `list` sidebar.

Each item declares a relative `segment`; the resolver derives complete paths,
active ancestry, and presentation models. The router can read the same
navigation structure, but page components and lazy loaders remain in the
separate section-owned page-route registry. They are deliberately not part of
the manifest.

Customer-detail `segment` values are canonical English route identifiers, not
display copy. The manifest currently derives `/customers/:id/dashboard`,
`/customers/:id/general-data`, `/customers/:id/cdd-crs-fatca`,
`/customers/:id/reviews`, `/customers/:id/reviews/details`,
`/customers/:id/monitoring`, `/customers/:id/limits`, and
`/customers/:id/products`. Visible labels come exclusively from `labelKey` and
the active i18n catalog, so changing language never changes a route or deep
link. The bare `/customers/:id` route redirects to
`/customers/:id/general-data` because `general-data` is the customer context's
configured default item. ADR 0030 records the complete manifest contract.

### URL-driven active state

The pathname remains the source of truth. A direct link, reload, or browser
back/forward action reconstructs the configured global Customers top tab and
selected customer-sidebar item. IWA's positional index is always derived from
the active manifest and is not stored in React or Redux state.

`resolveNavigation(pathname)` is the single pure interpreter of the manifest.
It returns complete models for the owning section and optional context, top
bar, sidebar, route ancestry and breadcrumb. `TopBarCustom`,
`ContextualSidebar`, the customer page heading and URL mirror consume those
models instead of repeating customer-specific pathname tests. The page heading
uses only the configured root item as its return destination, while the full
ancestry remains available to routing and other consumers. The router reads the
same manifest definitions to construct its static route tree.

Static destinations owned by a section take precedence over its dynamic
context. `/customers/all` therefore remains the configured list destination,
while `/customers/:id/...` enters customer context without maintaining a
second list of excluded static segments. The router also reads the context's
`defaultItem`, so the redirect from `/customers/:id` is configuration-driven
instead of being hardcoded in a customer page or route declaration.

`UrlStateSync` also mirrors every distinct content pathname to Redux through a
single `urlState/routeChanged` action. Its payload contains the exact pathname,
active section key, and contextual item ID. Consequently, deeper routes under
the same sidebar item remain independently observable by listener middleware
without dispatching from navigation components.

`MenuListAdapter` translates between the application's stable item IDs and the
numeric index expected by IWA `MenuList`. It does not recreate the visual menu.

### Ready-made IWA composition

The global sidebar composes IWA `NavigationPanel`, IWA `MenuList`, and icons
from the IWA icon package. Customer navigation composes IWA
`NavigationMenuItem` and its native `subNodes` contract within the same panel.
The customer page header uses IWA `ScreenHeading` for the single
manifest-derived return link and page title. Local components are limited to
routing, stable-ID adaptation, disclosure state, the semantic collapse button
that the installed IWA package does not export, desktop layout, and shared icon
presentation.

The resolved `navigationKey` keys the selected list or tree renderer. This
remounts the vendor navigation when a top-menu click replaces its complete item
model or when collapse mode replaces labels with an icon-only model. Collapse
state itself remains owned by the sidebar and is not reset by that remount.

The sidebar is desktop-only and can collapse to an icon rail. Its preference is
stored in local storage because it is a UI preference, not shareable view state.
The collapse action is a semantic button positioned at the start of the panel
header, next to the title. It exposes `aria-expanded` and `aria-controls`; a
native control is used because the installed IWA package does not export the
documented icon-button component. In collapsed mode, both the title and item
text are visually removed so only accessible icons remain.

Every URL rendered by the application shell has a sidebar. Sections without
dedicated contextual items use `navigationManifest.fallbackItem`, which links
to the current section root. Error pages intentionally remain outside the
application shell and therefore do not render application navigation.

### Shared selected and content surface

The main content and active navigation item use the semantic
`--content-surface` token (`#f0f0f0`). The remaining navigation surface stays
white. The relationship follows the supplied BIKS reference: the selected item
visually connects to the content it opens.

## Why this architecture

- **Easy configuration:** a destination is described once.
- **Independent surface policy:** top and contextual navigation can be
  configured separately without route-specific rendering branches.
- **Stable identity:** filtering or reordering does not change an item's route
  identity.
- **Reliable deep links:** selection always follows the URL.
- **IWA ownership:** the organization library remains responsible for visual
  and interactive menu behavior.
- **Vendor isolation:** the local adapter exposes an application-oriented
  stable-ID contract instead of leaking positional selection throughout the
  component tree.
- **Typed icons without an artificial allow-list:** configuration can reference
  any compatible IWA icon component directly.
- **Stable shell:** routes without dedicated items still show a predictable
  default overview entry.

## How to configure navigation

The complete declaration is edited in `navigation.manifest.ts`. A section and
its nested context use this shape:

```ts
export const navigationManifest = {
  defaultSection: 'home',
  fallbackItem: {
    id: 'overview',
    segment: '',
    labelKey: 'nav.sidebar.overview',
    icon: Settings,
    match: 'exact',
  },
  sections: [
    {
      id: 'customers',
      path: '/customers',
      labelKey: 'nav.tab.customers',
      defaultItem: 'all-customers',
      sidebar: {
        type: 'list',
        items: [
          {
            id: 'all-customers',
            segment: 'all',
            labelKey: 'nav.customers.all',
            icon: Settings,
            match: 'exact',
          },
        ],
      },
      context: {
        id: 'customer-detail',
        parameter: 'id',
        defaultItem: 'general-data',
        ariaLabelKey: 'nav.customerDetail.navigation',
        topBar: 'global',
        sidebar: {
          type: 'tree',
          items: [
            {
              id: 'general-data',
              segment: 'general-data',
              labelKey: 'nav.customerDetail.generalData',
              icon: Settings,
            },
            // Other recursive customer sidebar items.
          ],
        },
        breadcrumb: { rootItem: 'all-customers' },
      },
    },
  ],
} as const satisfies NavigationManifest;
```

At `/customers/all`, the section's `list` sidebar is active. At
`/customers/:id/...`, the nested context's `tree` sidebar is active. Static
section items take precedence over a dynamic context, so `all` is never
interpreted as a customer ID. At `/customers/:id`, the router looks up
`context.defaultItem` in that tree and redirects to its derived path. With the
configuration above, the destination is `/customers/:id/general-data`.
Changing the default requires changing only the item ID in the manifest;
direct L2 and deeper links are unaffected. If `defaultItem` is omitted, the
bare context path remains available without a redirect. An unknown item ID is
handled the same way defensively, although configuration tests should reject
that mismatch before release.

`breadcrumb.rootItem` identifies the section item used by the customer
`ScreenHeading` return action. The current `all-customers` value derives
`/customers/all`; the renderer labels that destination independently through
i18n as **My customers**. Customer IDs, active tabs, and deeper segments stay
out of the page heading because their hierarchy is already represented by the
contextual sidebar.

The sidebar contract is discriminated by `type`: `list` accepts only flat
items, while `tree` accepts recursive items. TypeScript therefore rejects
children that a list renderer could not display, and every configured tree
level is shared by the resolver, renderer, and route builder.

Each section supports at most one dynamic context. This mirrors the resolver's
unambiguous URL model; introducing multiple context kinds requires an explicit
matching policy rather than array order.

Set `topBar` to `'global'` to keep the owning section active in the application
top bar. Set it to `'context'` when the context's root items should become the
top-bar items. The renderer does not need a route-specific branch for either
mode.

### Navigation items

Import the desired icon from the installed IWA icon package and assign the
component to `icon`:

```ts
import { Settings } from 'ing-react-icons';

{
  id: 'dashboard',
  segment: 'dashboard',
  labelKey: 'nav.portfolio.dashboard',
  icon: Settings,
}
```

`icon` accepts any component compatible with:

```ts
type NavigationIconComponent = ComponentType<{ className?: string }>;
```

`NavigationIcon` instantiates the configured component and applies consistent
size, orange navigation color, and decorative accessibility semantics. Choosing
a new icon does not require changing a union or adding a registry entry.
The icon is required because the collapsed sidebar intentionally displays no
item text.

### Fallback item

`navigationManifest.fallbackItem` is used when the active section has no
dedicated sidebar items:

```ts
fallbackItem: {
  id: 'overview',
  segment: '',
  labelKey: 'nav.sidebar.overview',
  icon: Settings,
  match: 'exact',
},
```

The empty segment resolves to the active section root. Changing this one
declaration updates the fallback consistently for Home, Groups, Targets, and
the other currently empty application sections.

To add a new section destination:

1. Add one item to the target section in `navigation.manifest.ts`.
2. Give it a stable English `segment`; never derive a route from translated
   display text.
3. Add the new label key to both PL and EN catalogs.
4. Add the route-level component under `src/routes/pages/<section>/` when the
   real page exists.
5. Register its lazy loader in the section's
   `src/routes/pageRoutes/<section>.pageRoutes.ts` module. The mapping is
   checked against stable item IDs, while the URL remains derived from this
   manifest.
6. Add the section module once to the composition root in
   `pageRouteRegistry.ts` if it is not registered yet.
7. Add permissions only when the identity integration can evaluate them.

To add a context destination, add a recursive item to the context nested under
its owning section and add both translations. Any implemented page component
or lazy loader is wired separately so presentation never enters
`navigationManifest`.

## Relevant files

- [`src/routes/navigation/navigation.manifest.ts`](../src/routes/navigation/navigation.manifest.ts)
  — the complete physical configuration for all navigation surfaces.
- [`src/routes/navigation/navigation.types.ts`](../src/routes/navigation/navigation.types.ts)
  — manifest and resolved-model contracts, with no application configuration.
- [`src/routes/navigation/resolveNavigation.ts`](../src/routes/navigation/resolveNavigation.ts)
  — the single pathname-to-navigation-model interpreter.
- [`src/routes/navigation/index.ts`](../src/routes/navigation/index.ts)
  — public navigation exports consumed by application code.
- [`src/routes/router.tsx`](../src/routes/router.tsx)
  — manifest-derived route structure with static destinations before detail
  routes.
- [`src/routes/pageRoutes/pageRouteRegistry.ts`](../src/routes/pageRoutes/pageRouteRegistry.ts)
  — page-loader composition kept deliberately outside navigation metadata.
- [`src/routes/pageRoutes/customers.pageRoutes.tsx`](../src/routes/pageRoutes/customers.pageRoutes.tsx)
  — lazy page mappings owned by one navigation section.
- [`src/features/urlState/urlState.route.ts`](../src/features/urlState/urlState.route.ts)
  — serializable route snapshot parsing.
- [`src/features/urlState/UrlStateSync.tsx`](../src/features/urlState/UrlStateSync.tsx)
  — the single URL-to-Redux writer.
- [`src/components/ContextualSidebar/ContextualSidebar.tsx`](../src/components/ContextualSidebar/ContextualSidebar.tsx)
  — URL and desktop collapse orchestration.
- [`src/routes/pages/customers/CustomerDetailHeading.tsx`](../src/routes/pages/customers/CustomerDetailHeading.tsx)
  — IWA page heading with the manifest-derived customer-list return link.
- [`src/ui/ScreenHeading.tsx`](../src/ui/ScreenHeading.tsx) — stable
  `navigateTo` adapter around IWA `ScreenHeading`.
- [`src/ui/MenuListAdapter.tsx`](../src/ui/MenuListAdapter.tsx) — stable-ID
  adapter over IWA `MenuList`.
- [`src/ui/NavigationIcon.tsx`](../src/ui/NavigationIcon.tsx) — consistent
  presentation for the configured icon component.
- [`src/styles/global.css`](../src/styles/global.css) — semantic navigation and
  content surface tokens.

## Architecture references

- [ADR 0006 — URL as the single source of truth](adr/0006-url-as-single-source-of-truth.md)
- [ADR 0013 — IWA Components behind the UI seam](adr/0013-iwa-components-primereact.md)
- [ADR 0020 — React Router v6 for IWA compatibility](adr/0020-routing-react-router-v6-for-iwa-compatibility.md)
- [ADR 0023 — Configurable and persistent contextual navigation](adr/0023-configurable-navigation-icon-components.md)
- [ADR 0024 — Canonical route transitions in the Redux URL mirror](adr/0024-canonical-route-transitions-in-redux.md)
- [ADR 0027 — Section-scoped lazy page route modules](adr/0027-section-scoped-lazy-page-route-modules.md)
- [ADR 0030 — Unified configurable navigation manifest](adr/0030-unified-configurable-navigation-manifest.md)
- [Design brief](../.design/contextual-sidebar-navigation/DESIGN_BRIEF.md)
- [Information architecture](../.design/contextual-sidebar-navigation/INFORMATION_ARCHITECTURE.md)

## Validation and current limitation

The implementation has unit, component, and router-integration coverage for
configuration invariants, URL matching, stable-ID adaptation, L1–L3 deep
links, navigation, collapse persistence, and customer-summary request
lifecycle. The installed `iwa-react-components` package and its local Storybook
documentation were inspected directly; reusable primitives are consumed only
through the `@/ui` seam.

The installed IWA `NavigationMenuItem` supports one `subNodes` level but does
not expose a separate disclosure trigger, so the seam composes the trigger
around the vendor item. The package also does not export the `Tooltip` or
`IconButton` APIs documented in Storybook. Its `TabMenu` and `MenuList` emit
positional buttons with `aria-selected` but without complete tab/list
semantics, and the small Sky `Label` palette does not meet normal-text AA
contrast. The UI seam normalizes the current `ScreenHeading` `navigateTo`
contract and the older local compatibility package's `url` alias. The remaining
vendor gaps are input for the component guild rather than reasons to mutate
vendor-rendered DOM or override IWA colors locally.
