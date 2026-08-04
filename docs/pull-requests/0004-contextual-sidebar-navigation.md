# PR #4 Squash Commit Message

```text
feat(navigation): add configurable URL-driven contextual sidebar

Add a desktop contextual sidebar built from the ready-made IWA
NavigationPanel and MenuList components.

Keep top-level sections, contextual items, relative path segments, labels,
permissions, defaults, and icon components in one typed frontend manifest.
Derive routes, redirects, active states, and menu rendering from that
configuration to prevent duplicated navigation data.

Use stable item IDs in application code and isolate IWA's positional
selectedIndex inside MenuListAdapter. Remount the vendor list when its section
or presentation mode changes so switching the top menu always loads the correct
sidebar model.

Place the collapse control in the panel header and render only configured icons
in collapsed mode. Preserve the user's desktop collapse preference in local
storage and provide a shared Overview item for sections without dedicated menu
entries.

Allow every contextual item to reference any compatible ing-react-icons
component directly. Keep icon sizing, color, and accessibility behavior
consistent through the shared NavigationIcon presentation component.

Treat the URL as the navigation source of truth. Mirror every distinct pathname
to Redux through urlState/routeChanged with the exact pathname, active section
key, and contextual item ID. This makes shallow routes, deeper entity URLs,
direct links, redirects, and browser history observable by selectors and
listener middleware without dispatching from navigation components.

Keep query-only state such as filters, sorting, and pagination on its existing
typed actions. Derive the active top tab, item ID, and pathname from one
canonical Redux route object instead of maintaining duplicate navigation state.

Apply the shared #f0f0f0 semantic surface to both selected navigation items and
routed content. Add Polish and English labels plus unit and component coverage
for configuration, URL matching, sidebar switching, collapsed navigation, deep
route transitions, Redux actions, and derived selectors.

Validated with ESLint, strict TypeScript typecheck, 42 unit/component tests,
Prettier, git diff --check, and the production Vite build.

Refs: #4
```
