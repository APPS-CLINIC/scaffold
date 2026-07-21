# Build Tasks: Contextual Sidebar Navigation

Generated from: `.design/contextual-sidebar-navigation/DESIGN_BRIEF.md`
Date: 2026-07-20

## Foundation

- [ ] **Prove the IWA navigation composition with a real route slice**: In an environment with the private packages installed, render an IWA navigation shell, `MenuList`, collapse control, icons, and tooltips for two configured Portfolio destinations; verify the actual prop types, selected styling, keyboard semantics, and icon-rail feasibility. Do not introduce a custom visual fallback. _Reuses: IWA components, existing React Router and test helpers._
- [x] **Create the declarative navigation manifest with the Portfolio slice**: Add typed section/item helpers, configurable icon component references, uniqueness/default-item validation, and Portfolio route declarations; derive top-tab data, full paths, matching, and router entries from the declaration. Record the route-manifest decision in an ADR and cover invariants with unit tests. _Modifies: `navTabs`, router configuration, URL navigation parsing. Creates: navigation configuration modules._

## Core UI

- [x] **Build the Portfolio contextual sidebar**: Compose the verified IWA shell and `MenuList` through a thin `@/ui` adapter, render all supplied Portfolio items, redirect `/portfolio` to `/portfolio/dashboard`, and keep selected state driven by the pathname. Apply white navigation and `#f0f0f0` selected/content surfaces. _Reuses: IWA navigation components; modifies: `RootLayout` and Portfolio routes._
- [x] **Add the Clients vertical slice**: Configure All clients and Client advisors, redirect `/clients` to `/clients/all`, and verify that switching between Portfolio and Clients replaces the list and selects the correct default item. _Reuses: navigation manifest and IWA adapter; creates: Clients configuration only._
- [x] **Integrate the remaining existing top sections**: Move all current tab metadata into independent section configuration modules while preserving labels, order, paths, and placeholder pages. Sections without item data use the shared root-link fallback and require no conditional logic inside the IWA adapter. _Modifies: existing top navigation and generated placeholder routes._

## Interactions & States

- [x] **Add desktop collapse behavior**: Place an IWA collapse control in the panel header, switch between expanded labels and an icon-only rail, and store the preference in local storage with a safe default. Final focus and tooltip verification remains part of the real-IWA accessibility pass. _Depends on: verified IWA navigation composition._
- [ ] **Add permission-aware navigation**: Support optional typed permission requirements in configuration, filter visible items without changing their stable IDs, and protect direct known URLs with the existing 403 experience. Default to all items visible until the application's identity source is integrated. _Modifies: manifest selectors and route boundary._
- [x] **Verify URL-driven navigation behavior**: Cover top-tab selection, sidebar selection, default redirects, direct nested links, reload initialization, and browser back/forward behavior without persisting IWA indexes. _Reuses: URL mirror and React Router test utilities._

## Desktop Polish

- [ ] **Polish supported desktop layouts**: Verify the expanded and collapsed shell at common desktop widths, independent content/sidebar scrolling, long Polish and English labels, top-tab overflow, and consistent `#f0f0f0` content/selection alignment. No mobile-specific behavior is included. _Modifies: shell layout and semantic design tokens._
- [ ] **Complete the accessibility pass**: Verify navigation names, current-item semantics, keyboard order, visible focus, icon-only accessible labels, IWA tooltips, collapse focus retention, and WCAG AA contrast for all interaction states. _Reuses: IWA semantics; adds focused component tests where observable in jsdom._

## Review

- [ ] **Design review**: Run `design-review` against the brief and supplied visual references after the IWA implementation is available.
- [ ] **Quality gates**: Run formatting checks, lint, strict typecheck, unit/component tests, and production build in an environment configured for the private IWA registry; document any registry prerequisite without committing credentials.
