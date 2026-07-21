# Information Architecture: Contextual Sidebar Navigation

## Site Map

- Home `/`
- Portfolio `/portfolio` -> redirects to `/portfolio/dashboard`
  - Dashboard `/portfolio/dashboard`
  - Portfolio clients `/portfolio/clients`
  - Reviews `/portfolio/reviews`
  - ING monitoring `/portfolio/ing-monitoring`
  - Limits `/portfolio/limits`
  - Products `/portfolio/products`
  - Revenue and financial data `/portfolio/financial-data`
  - Related persons `/portfolio/related-persons`
  - Proxies `/portfolio/proxies`
  - IWA documents `/portfolio/iwa-documents`
  - Audit process `/portfolio/audit-process`
- Clients `/clients` -> redirects to `/clients/all`
  - All clients `/clients/all`
  - Client advisors `/clients/advisors`
- Groups `/groups`
- Targets `/targets`
- Pipeline `/pipeline`
- Orders `/orders`
- Transactions `/transactions`
- BI reports `/bi-reports`
- Calendar `/calendar`
- Forbidden `/403`
- Not found `/404`

Sections without known sidebar data retain their current section-root routes. Adding contextual items later must not require changes to the sidebar component.

## Navigation Model

- **Primary navigation**: The existing IWA top tab menu. Its order, labels, root paths, and default destinations come from one typed manifest.
- **Secondary navigation**: A flat IWA `MenuList` scoped to the active primary section. Portfolio and Clients have initial item sets; sections without items omit the sidebar.
- **Utility navigation**: Existing recent-items, quick-search, profile, settings, and logout controls remain in the IWA top bar and outside the content hierarchy.
- **Desktop navigation**: The sidebar is expanded by default and can collapse to an icon rail. There is no mobile navigation variant.

The primary and secondary selections are derived from the pathname. IWA's numeric `selectedIndex` is isolated inside `MenuListAdapter` and is never treated as application state.

## Content Hierarchy

### Application Shell

1. Primary section navigation -- establishes the user's working context.
2. Contextual sidebar -- exposes views within the active section.
3. Routed content -- occupies the remaining area on the `#f0f0f0` content surface.
4. Utility actions and footer -- remain secondary to the working context.

### Portfolio

1. Dashboard -- the default entry point and overview.
2. Client-related views -- the most frequent portfolio drill-downs.
3. Monitoring, limits, products, and financial data -- specialist operational views.
4. Related persons, proxies, documents, and audit process -- supporting and compliance views.

### Clients

1. All clients -- the default client search and browse view.
2. Client advisors -- the alternate organization-oriented view.

## User Flows

### Change Primary Section

1. The user selects an existing top tab.
2. The application resolves the section's `defaultItemId` from the manifest.
3. The router navigates to the default item's full path.
4. The contextual IWA `MenuList` changes and marks the path-matched item as selected.

### Navigate Within a Section

1. The user selects a sidebar item.
2. The adapter resolves the IWA index to a stable configured item.
3. React Router navigates to that item's path.
4. URL synchronization updates the active section while the item index is recomputed from the pathname.

### Open a Deep Link

1. The user opens a nested route directly or uses browser history.
2. The pathname matcher identifies the primary section and sidebar item.
3. Both IWA navigation surfaces render the matching selection without local initialization state.

### Access a Restricted View

1. The permission filter removes unauthorized items from the visible menu.
2. If the user follows a direct URL to a known unauthorized route, the route access boundary renders the forbidden experience.
3. Unknown URLs continue to render the not-found experience.

### Configure a New Sidebar Item

1. A developer adds one item declaration under the target section.
2. The declaration supplies a stable ID, relative path segment, i18n key, icon key, page reference, match rule, and optional permissions.
3. The helper derives the full path and validates uniqueness.
4. The router and sidebar consume the item without duplicated path or selection wiring.

## Naming Conventions

| Concept                | Label in UI            | Notes                                                              |
| ---------------------- | ---------------------- | ------------------------------------------------------------------ |
| Primary section        | Top tab label          | Existing labels remain unchanged.                                  |
| Contextual navigation  | Navigation             | Localized through i18next.                                         |
| Stable identifier      | `sectionId` / `itemId` | English kebab-case or typed string literals; never array indexes.  |
| Route fragment         | `segment`              | Relative to the section root; the helper constructs the full path. |
| Visual icon reference  | `iconKey`              | Serializable key mapped to an IWA icon in one registry.            |
| Default destination    | `defaultItemId`        | Must reference an item within the same section.                    |
| Permission requirement | `requiredPermissions`  | Optional typed list evaluated by the access seam.                  |

## Component Reuse Map

| Component                                 | Used on                         | Behavior differences                                                               |
| ----------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| IWA `TopBar` + `TabMenu`                  | All application routes          | Active index and destination come from the shared manifest.                        |
| IWA `NavigationPanel`                     | Routes with contextual items    | Used as the shell only if the installed version supports the required composition. |
| IWA `MenuList`                            | Portfolio and Clients initially | Items and selected index change with the active section.                           |
| IWA collapse control, icons, and tooltips | Contextual sidebar              | Expanded mode shows labels; collapsed mode exposes icon affordances.               |
| `RootLayout`                              | All non-error routes            | Sidebar is omitted for sections without configured items.                          |
| `ErrorLayout`                             | `/403`, `/404`, catch-all       | No top or sidebar navigation.                                                      |

## Content Growth Plan

Each top section owns an independent configuration module and exports one section declaration. A small aggregator preserves the global tab order. This avoids a single oversized configuration file while retaining one import point for the router and navigation selectors.

New flat items can be added without changing the IWA adapter. If a future requirement introduces nested navigation, it must be treated as a new design and component decision rather than overloading the flat `MenuList` model.

## URL Strategy

- Pattern: `/<section>/<view>` for contextual views.
- Section roots: redirect to the configured default item when items exist.
- Dynamic segments: future entity identifiers may follow the view path, for example `/clients/all/:clientId`; matching can use an explicit prefix rule.
- Query parameters: remain reserved for shareable page view state such as search, sorting, filters, and pagination.
- Active navigation: derived from pathname; never encoded in query parameters or persisted as an IWA index.
- Unknown paths: render 404. Known but unauthorized paths: render 403.
