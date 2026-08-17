# Contextual Sidebar Navigation

This document describes the contextual desktop navigation introduced by the
`feat/contextual-sidebar-navigation` change, why the implementation has this
shape, and how to extend it safely.

## What changes

### One typed navigation manifest

`src/routes/navigation/navigation.config.ts` is the configuration source for:

- existing IWA top tabs;
- contextual sidebar items;
- section default redirects;
- generated placeholder routes;
- URL-to-section and URL-to-item matching;
- optional permission metadata;
- the IWA icon displayed for each contextual item.
- the shared fallback item used by sections without dedicated entries.

Paths are not copied into multiple arrays. Each contextual item declares a
relative `segment`, and helpers derive its full URL from the parent section.

### URL-driven active state

The pathname remains the source of truth. A direct link, reload, or browser
back/forward action reconstructs both the active top tab and selected sidebar
item. IWA's positional `selectedIndex` is not stored in React or Redux state.

`UrlStateSync` also mirrors every distinct content pathname to Redux through a
single `urlState/routeChanged` action. Its payload contains the exact pathname,
active section key, and contextual item ID. Consequently, deeper routes under
the same sidebar item remain independently observable by listener middleware
without dispatching from navigation components.

`MenuListAdapter` translates between the application's stable item IDs and the
numeric index expected by IWA `MenuList`. It does not recreate the visual menu.

### Ready-made IWA composition

The sidebar composes IWA `NavigationPanel`, IWA `MenuList`, and icons from the
IWA icon package. Local components are limited to routing, stable-ID adaptation,
desktop layout, and shared icon presentation.

The contextual `MenuList` is keyed by section and presentation mode. This
remounts the vendor list when a top-menu click replaces its complete item model
or when collapse mode replaces labels with an icon-only model. Collapse state
itself remains owned by the sidebar and is not reset by that remount.

The sidebar is desktop-only and can collapse to an icon rail. Its preference is
stored in local storage because it is a UI preference, not shareable view state.
The collapse action is an IWA `MenuList` control positioned at the start of the
panel header, next to the title. In collapsed mode, both the title and item text
are visually removed so only accessible icons remain.

Every URL rendered by the application shell has a sidebar. Sections without
dedicated contextual items use `defaultNavigationItem`, which links to the
current section root. Error pages intentionally remain outside the application
shell and therefore do not render application navigation.

### Shared selected and content surface

The main content and active navigation item use the semantic
`--content-surface` token (`#f0f0f0`). The remaining navigation surface stays
white. The relationship follows the supplied BIKS reference: the selected item
visually connects to the content it opens.

## Why this architecture

- **Easy configuration:** a destination is described once.
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

## How to configure an item

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

## How to configure the default item

`defaultNavigationItem` lives next to the section manifest. It is used only
when the active section has no dedicated items:

```ts
export const defaultNavigationItem = {
  id: 'overview',
  segment: '',
  labelKey: 'nav.sidebar.overview',
  icon: Settings,
  match: 'exact',
} satisfies NavigationItemConfig;
```

The empty segment resolves to the active section root. Changing this one
declaration updates the fallback consistently for Home, Groups, Targets, and
the other currently empty application sections.

To add a new destination:

1. Add one item to the target section in `navigation.config.ts`.
2. Add the new label key to both PL and EN catalogs.
3. Add the route-level component under `src/routes/pages/<section>/` when the
   real page exists.
4. Register its lazy loader in the section's
   `src/routes/pageRoutes/<section>.pageRoutes.ts` module. The mapping is
   checked against stable item IDs, while the URL remains derived from this
   manifest.
5. Add the section module once to the composition root in
   `pageRouteRegistry.ts` if it is not registered yet.
6. Add permissions only when the identity integration can evaluate them.

## Relevant files

- [`src/routes/navigation/navigation.config.ts`](../src/routes/navigation/navigation.config.ts)
  — section and item declarations.
- [`src/routes/navigation/navigation.ts`](../src/routes/navigation/navigation.ts)
  — path, matching, default, and permission helpers.
- [`src/routes/pageRoutes/pageRouteRegistry.ts`](../src/routes/pageRoutes/pageRouteRegistry.ts)
  — small composition root for section-scoped route modules.
- [`src/routes/pageRoutes/customers.pageRoutes.ts`](../src/routes/pageRoutes/customers.pageRoutes.ts)
  — lazy page mappings owned by one navigation section.
- [`src/features/urlState/urlState.route.ts`](../src/features/urlState/urlState.route.ts)
  — serializable route snapshot parsing.
- [`src/features/urlState/UrlStateSync.tsx`](../src/features/urlState/UrlStateSync.tsx)
  — the single URL-to-Redux writer.
- [`src/components/ContextualSidebar/ContextualSidebar.tsx`](../src/components/ContextualSidebar/ContextualSidebar.tsx)
  — URL and desktop collapse orchestration.
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
- [Design brief](../.design/contextual-sidebar-navigation/DESIGN_BRIEF.md)
- [Information architecture](../.design/contextual-sidebar-navigation/INFORMATION_ARCHITECTURE.md)

## Validation and current limitation

The implementation has unit and component coverage for configuration
invariants, URL matching, stable-ID adaptation, navigation, and collapse
persistence. Lint, typecheck, tests, and the production build were run against a
temporary validation contract reconstructed from the supplied IWA Storybook
screens.

The private IWA registry is not available in this checkout. Final review must
verify exact package types, icons, focus behavior, and visual details against
the real `iwa-react-components` version. No custom visual fallback is included.
