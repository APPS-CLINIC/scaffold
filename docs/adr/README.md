# Architecture Decision Records

An **Architecture Decision Record (ADR)** describes a single architecturally
significant decision: the context that forced it, the decision made, and the
consequences that follow. ADRs are **append-only** — once accepted, an ADR is
never edited; if the decision changes, a new ADR supersedes the old one (and
the old ADR's status is updated to point at the new one).

See [ADR 0000](0000-record-architecture-decisions.md) to understand why we
keep ADRs at all; use it as the template for new records.

## Status legend

- **Accepted** — in force; reflected in the code.
- **Proposed** — under discussion.
- **Superseded by ADR-XXXX** — replaced by a later decision.
- **Deprecated** — no longer relevant.

## Index

### Step 01 — Scaffold and configuration

| ADR                                                  | Title                                                  | Status   |
| ---------------------------------------------------- | ------------------------------------------------------ | -------- |
| [0000](0000-record-architecture-decisions.md)        | Record architecture decisions                          | Accepted |
| [0001](0001-build-tooling-vite-swc.md)               | Vite 6 + SWC as build and dev tooling                  | Accepted |
| [0002](0002-typescript-strict-and-project-config.md) | Strict TypeScript with project references              | Accepted |
| [0003](0003-package-manager-npm.md)                  | npm as the package manager                             | Accepted |
| [0004](0004-code-quality-gates.md)                   | Quality gates: ESLint + Prettier + Husky + lint-staged | Accepted |
| [0005](0005-testing-vitest-testing-library.md)       | Vitest + Testing Library for testing                   | Accepted |

### Step 02 — Application architecture

| ADR                                                               | Title                                               | Status                 |
| ----------------------------------------------------------------- | --------------------------------------------------- | ---------------------- |
| [0006](0006-url-as-single-source-of-truth.md)                     | URL as the single source of truth for view state    | Accepted               |
| [0007](0007-redux-toolkit-and-rtk-query.md)                       | Redux Toolkit + RTK Query for state and caching     | Accepted               |
| [0008](0008-zod-total-parsing-of-search-params.md)                | Total parsing of search params with Zod             | Superseded by ADR-0026 |
| [0009](0009-reselect-and-listener-middleware.md)                  | Reselect selectors + listener middleware            | Accepted               |
| [0012](0012-routing-react-router-v7.md)                           | Routing with React Router v7                        | Superseded by ADR-0020 |
| [0020](0020-routing-react-router-v6-for-iwa-compatibility.md)     | React Router v6 for IWA compatibility               | Accepted               |
| [0022](0022-typed-navigation-manifest.md)                         | Typed frontend manifest for contextual navigation   | Superseded by ADR-0023 |
| [0023](0023-configurable-navigation-icon-components.md)           | Configurable and persistent contextual navigation   | Accepted               |
| [0024](0024-canonical-route-transitions-in-redux.md)              | Canonical route transitions in the Redux URL mirror | Accepted               |
| [0025](0025-configuration-driven-generic-data-tables.md)          | Configuration-driven generic data tables            | Accepted               |
| [0026](0026-extensible-feature-filters-in-list-urls.md)           | Extensible feature filters in list URLs             | Accepted               |
| [0027](0027-section-scoped-lazy-page-route-modules.md)            | Section-scoped lazy page route modules              | Accepted               |
| [0028](0028-development-preview-data-through-rtk-query.md)        | Development preview data through RTK Query          | Accepted               |
| [0029](0029-customer-summary-redux-mirror-slice.md)               | Customer summary as a read-only Redux mirror slice  | Superseded by ADR-0031 |
| [0030](0030-unified-configurable-navigation-manifest.md)          | Unified configurable navigation manifest            | Accepted               |
| [0031](0031-customer-summary-read-directly-from-rtk-query.md)     | Customer summary read directly from RTK Query       | Accepted               |
| [0032](0032-explicit-route-objects-for-customer-detail-tree.md)   | Explicit route objects for the customer detail tree | Accepted               |
| [0033](0033-customer-detail-presentation-feature-local.md)        | Customer detail presentation is feature-local       | Accepted               |
| [0034](0034-user-table-preferences-in-a-persisted-redux-slice.md) | User table preferences in a persisted Redux slice   | Accepted               |

### Step 03 — Scope alignment (discovery)

| ADR                                                    | Title                                                       | Status                 |
| ------------------------------------------------------ | ----------------------------------------------------------- | ---------------------- |
| [0013](0013-iwa-components-primereact.md)              | IWA Components (PrimeReact) as the UI library behind `@/ui` | Accepted               |
| [0014](0014-internationalization-i18n.md)              | Internationalization (i18n)                                 | Accepted               |
| [0019](0019-tailwind-utilities.md)                     | Tailwind CSS v4 (utilities layer) alongside CSS modules     | Superseded by ADR-0021 |
| [0021](0021-tailwind-v3-for-iwa-compatibility.md)      | Tailwind CSS v3 for IWA compatibility                       | Accepted               |
| [0035](0035-dnd-kit-for-accessible-list-reordering.md) | @dnd-kit for accessible list reordering                     | Accepted               |
| [0036](0036-date-fns-for-calendar-dates.md)            | date-fns for calendar dates                                 | Accepted               |
