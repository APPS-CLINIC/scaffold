# Design Brief: Contextual Sidebar Navigation

## Problem

Users move between several data-heavy application sections from the top navigation, but the current sidebar does not reflect the selected section. They need a predictable way to reach section-specific views without learning a different interaction model for every area. The navigation must also remain easy for developers to extend without duplicating paths, labels, selection rules, or router entries.

## Solution

Provide a desktop-only application shell in which the existing top navigation selects a primary section and an IWA `MenuList` shows the flat set of views for that section. A single typed frontend manifest declares each section, its default destination, and its sidebar items. The router, top navigation, sidebar, redirects, and active-state matching all consume this manifest.

The URL remains the source of truth. Selecting a top-level section navigates to its configured default item, selecting a sidebar item navigates to its route, and direct links or browser history reconstruct both active states. The sidebar can collapse to an icon rail and retains the preference locally.

## Experience Principles

1. **Configuration over duplication** -- a navigation item is declared once and is then available to routing, labels, active-state matching, redirects, and access filtering.
2. **URL confidence over hidden state** -- the current section and item always follow the pathname, so deep links, reload, and back/forward navigation behave consistently.
3. **IWA-native over custom recreation** -- visual and interactive navigation elements use ready-made IWA components; local code only adapts application configuration and React Router behavior.

## Aesthetic Direction

- **Philosophy**: Calm, functional banking workspace with contextual disclosure.
- **Tone**: Authoritative, predictable, and restrained.
- **Reference points**: The supplied BIKS navigation screenshot; IWA `MenuList`, `NavigationPanel`, top bar, icons, buttons, and tooltips.
- **Anti-references**: A bespoke design system, decorative dashboard styling, nested accordion navigation, mobile drawer behavior, and legacy React-element JSON structures.
- **Surface relationship**: The main content uses `#f0f0f0`; the selected sidebar item uses the same surface so it visually joins the active content area. The remaining sidebar surface stays white.

## Existing Patterns

- Typography: System font stack from `src/styles/global.css`.
- Colors: CSS custom properties mapped into Tailwind v3; new navigation colors must be added as semantic variables instead of repeated hex values.
- Spacing: Tailwind v3 utilities and the existing full-height grid shell.
- Routing: React Router v6 with the URL as the single source of truth and a one-way URL-to-Redux mirror.
- Components: Existing IWA `TopBar` and `TabMenu`; IWA `MenuList` is the selected list component. `NavigationPanel` may provide the titled shell when its installed contract is verified.
- UI seam: Application code consumes IWA through thin exports or adapters in `@/ui` rather than importing vendor components into route features.
- Internationalization: Static navigation labels use typed i18next keys in both Polish and English catalogs.

## Component Inventory

| Component                            | Status         | Notes                                                                                                            |
| ------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `TopBarCustom`                       | Modify         | Continue using IWA `TopBar` and `TabMenu`, but derive tabs and destinations from the shared manifest.            |
| `MenuListAdapter` for IWA `MenuList` | New            | Translate stable item IDs and paths into IWA's index-based selection API; do not recreate its visuals.           |
| IWA navigation shell                 | Verify / reuse | Prefer `NavigationPanel` plus IWA controls if it composes cleanly with `MenuList`.                               |
| `ContextualSidebar`                  | New            | Presentation-free orchestration of configuration, URL matching, permissions, collapse state, and IWA components. |
| `RootLayout`                         | Modify         | Host the collapsible desktop sidebar and apply the content surface token.                                        |
| Navigation manifest                  | New            | Typed, declarative section and item definitions consumed by all navigation surfaces.                             |
| Route access boundary                | New            | Hide unauthorized items and send direct unauthorized navigation to the existing 403 route.                       |
| Existing error pages                 | Exists         | Reuse `/403` and `/404` outside the main application shell.                                                      |

## Key Interactions

1. Selecting a top tab navigates directly to that section's configured default route, such as `/portfolio/dashboard`.
2. The sidebar items change to the items declared for the active top section.
3. Selecting an IWA `MenuList` item navigates to its configured path. The selected IWA index is computed from the pathname and is never persisted separately.
4. Visiting a nested URL directly reconstructs the active top tab and sidebar item.
5. The collapse control sits before the Navigation title in the panel header and switches between expanded labels and an icon-only rail. The control, icons, and tooltips are IWA components, and the preference is stored locally.
6. Access filtering removes unauthorized items. Direct access to an unauthorized known route resolves to the existing forbidden experience.
7. Sections without configured sidebar items continue to render their existing section page and show a shared Overview fallback that links to the section root.

## Responsive Behavior

The supported experience is desktop only. The layout must remain usable across common desktop viewport widths, preserve independent content scrolling, and avoid clipping the top navigation or sidebar controls. No mobile drawer, hamburger breakpoint, or touch-specific navigation is included.

## Accessibility Requirements

- Use the semantics supplied by IWA components and verify them in the installed package version.
- The sidebar has an accessible navigation name, and the selected item exposes its current state.
- The collapse control exposes an accessible name and `aria-expanded` state.
- Icon-only rail items have IWA tooltips and accessible names.
- All navigation is operable by keyboard with visible focus indicators.
- Focus is not lost when the sidebar collapses or the contextual item set changes.
- Text, icon, selected, hover, and focus states meet WCAG AA contrast requirements against white and `#f0f0f0` surfaces.

## Out of Scope

- Mobile and tablet-specific navigation patterns.
- A custom replacement for IWA components.
- Backend-delivered navigation configuration.
- Page content beyond existing placeholders.
- Final sidebar data for sections other than Portfolio and Clients.
- Repository credentials or private npm tokens.
