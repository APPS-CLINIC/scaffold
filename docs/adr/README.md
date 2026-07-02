# Architecture Decision Records

An **Architecture Decision Record (ADR)** captures a single, architecturally
significant decision: the context that forced it, the decision taken, and the
consequences that follow. ADRs are **append-only** — once accepted, an ADR is
not edited; if a decision changes, a new ADR supersedes the old one (and the
old one's status is updated to point at the new one).

See [ADR 0000](0000-record-architecture-decisions.md) to understand why we keep
ADRs at all; use it as the template for new records too.

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
| [0005](0005-testing-vitest-testing-library.md)       | Vitest + Testing Library for tests                     | Accepted |

### Step 02 — Application architecture

| ADR                                                | Title                                            | Status   |
| -------------------------------------------------- | ------------------------------------------------ | -------- |
| [0006](0006-url-as-single-source-of-truth.md)      | URL as the single source of truth for view state | Accepted |
| [0007](0007-redux-toolkit-and-rtk-query.md)        | Redux Toolkit + RTK Query for state and cache    | Accepted |
| [0008](0008-zod-total-parsing-of-search-params.md) | Total parsing of search params with Zod          | Accepted |
| [0009](0009-reselect-and-listener-middleware.md)   | reselect selectors + listener middleware         | Accepted |
| [0012](0012-routing-react-router-v7.md)            | Routing with React Router v7                     | Accepted |

### Step 03 — Scope alignment (discovery)

| ADR                                       | Title                                    | Status   |
| ----------------------------------------- | ---------------------------------------- | -------- |
| [0013](0013-iwa-components-primereact.md) | IWA UI Components behind the `@/ui` seam | Accepted |
| [0014](0014-internationalization-i18n.md) | Internationalization (i18n)              | Accepted |
