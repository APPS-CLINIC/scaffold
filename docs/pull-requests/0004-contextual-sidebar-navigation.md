# PR #4 — Configurable Contextual Sidebar Navigation

This delivery note explains what PR #4 changes, why the implementation is
structured this way, and how developers should extend it.

## Recommended squash commit

```text
feat(navigation): add configurable URL-driven contextual sidebar
```

Suggested commit body:

```text
Build the desktop contextual sidebar from IWA NavigationPanel and MenuList.
Keep routes, labels, permissions, defaults, and icon components in one typed
frontend manifest. Treat the URL as the navigation source of truth and mirror
every pathname transition to Redux for listeners, analytics, and prefetching.
```

## What the PR delivers

- A desktop-only contextual sidebar whose items depend on the active top-level
  menu section.
- A typed frontend navigation manifest shared by the top tabs, sidebar, route
  generation, default redirects, active matching, and permission metadata.
- Ready-made IWA `NavigationPanel` and `MenuList` components behind the local UI
  seam.
- `MenuListAdapter`, which translates stable application item IDs into IWA's
  positional `selectedIndex` contract.
- A header-mounted IWA collapse control and an icon-only collapsed rail.
- A shared Overview fallback, so every application-shell route has a sidebar
  even when its section has no dedicated items yet.
- Direct icon configuration with any compatible `ing-react-icons` component;
  there is no closed icon-name registry.
- A shared `#f0f0f0` semantic surface for selected navigation and page content.
- A canonical Redux route mirror that emits `urlState/routeChanged` for every
  distinct content pathname.
- Polish and English navigation messages, unit/component tests, design notes,
  and architecture decisions.

## Why it is implemented this way

### The URL owns navigation

Navigation components call React Router's `navigate`. They do not dispatch
navigation state directly. `UrlStateSync` observes the resulting URL and is the
single writer to the Redux URL mirror.

This makes clicks, redirects, deep links, and browser back/forward navigation
follow the same path:

```text
user or browser navigation
  -> React Router URL
  -> UrlStateSync
  -> urlState/routeChanged
  -> selectors and listener middleware
  -> routed content
```

### Every content pathname is observable

The Redux route snapshot contains:

```ts
interface UrlRouteState {
  pathname: string;
  sectionKey: NavigationSectionKey;
  itemId: string | null;
}
```

Keeping the complete pathname is necessary because these URLs may render
different content while belonging to the same top section and sidebar item:

```text
/clients/all
/clients/all/123
/clients/all/456
/clients/all/123/documents
```

Each distinct pathname emits `urlState/routeChanged`. Query-only view state,
such as filters, sorting, and pagination, keeps its feature-specific validated
actions such as `listQueryChanged`.

### Stable IDs isolate IWA indexes

IWA `MenuList` selects by array index, but indexes change when configuration is
reordered or permission-filtered. Application code therefore uses stable IDs;
only `MenuListAdapter` converts between an ID and an IWA index.

The contextual list is remounted when its section or presentation mode changes.
This ensures that a vendor component with an internal item model reloads after
a top-menu change and when expanded labels become an icon-only model.

### Static TypeScript is the configuration format

The navigation is currently frontend-owned, so TypeScript is a stronger and
simpler contract than runtime JSON. It supports literal IDs, typed i18n keys,
permission metadata, and direct icon component references.

React elements, component functions, `props`, `key`, and `ref` must not be
serialized into JSON. A future backend-delivered menu requires a separate
serializable schema and an allow-listed icon resolver.

## How to configure navigation

Edit `src/routes/navigation/navigation.config.ts` and add an item to the target
section:

```ts
import { Settings } from 'ing-react-icons';

{
  id: 'dashboard',
  segment: 'dashboard',
  labelKey: 'nav.portfolio.dashboard',
  icon: Settings,
}
```

Then:

1. Add the label to both `src/i18n/messages/pl.ts` and
   `src/i18n/messages/en.ts`.
2. Replace the generated placeholder route element when the real feature page
   is available.
3. Add `requiredPermissions` only when the application's identity integration
   can evaluate them.
4. Add or update tests for the new default, matching rule, or permission rule.

Full paths must not be duplicated in item declarations. `segment` is relative
to the section path, and navigation helpers derive the final URL.

## How to react to route changes

Use Redux Toolkit listener middleware and match `routeChanged`; do not add a
navigation `useEffect` to menu components:

```ts
startAppListening({
  actionCreator: routeChanged,
  effect: async ({ payload }) => {
    // Analytics, prefetching, or cross-feature coordination.
    // payload.pathname, payload.sectionKey, payload.itemId
  },
});
```

Read navigation through the derived selectors:

- `selectRoute`
- `selectPathname`
- `selectActiveTab`
- `selectActiveTabIndex`
- `selectActiveNavigationItemId`

Redux is a read-only mirror. Code must never dispatch `routeChanged` as a way to
navigate and must never synchronize the store back into the URL.

## Key files

- `src/routes/navigation/navigation.config.ts` — navigation declarations.
- `src/routes/navigation/navigation.ts` — path and matching helpers.
- `src/components/ContextualSidebar/ContextualSidebar.tsx` — sidebar
  orchestration.
- `src/ui/MenuListAdapter.tsx` — stable ID to IWA index adapter.
- `src/features/urlState/urlState.route.ts` — route snapshot parser.
- `src/features/urlState/UrlStateSync.tsx` — single URL-to-Redux writer.
- `src/features/urlState/urlState.slice.ts` — `routeChanged` reducer.
- `src/features/urlState/urlState.selectors.ts` — derived navigation reads.

## Architecture references

- [ADR 0006 — URL as the single source of truth](../adr/0006-url-as-single-source-of-truth.md)
- [ADR 0013 — IWA Components behind the UI seam](../adr/0013-iwa-components-primereact.md)
- [ADR 0023 — Configurable and persistent contextual navigation](../adr/0023-configurable-navigation-icon-components.md)
- [ADR 0024 — Canonical route transitions in the Redux URL mirror](../adr/0024-canonical-route-transitions-in-redux.md)
- [Contextual sidebar implementation guide](../contextual-sidebar-navigation.md)

## Validation performed

- ESLint passed.
- Strict TypeScript typecheck passed.
- All 42 unit and component tests passed.
- The production Vite build passed.
- Prettier formatting and `git diff --check` passed.

## Environment note

The unscoped private package `ing-react-icons` currently resolves against the
public npm registry in this checkout and returns HTTP 404 during `npm ci`.
Validation used a temporary local contract reconstructed from the supplied IWA
Storybook references. Final review should confirm exact private-package types,
focus behavior, tooltips, and visual details after the private registry URL is
configured.
