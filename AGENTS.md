# AGENTS.md — guide for AI coding agents

This file gives coding agents (GitHub Copilot, Claude Code, etc.) a complete,
trustworthy picture of this repository. Read it before making changes.
Human-facing docs live in [`README.md`](README.md) and [`docs/`](docs/README.md);
this file distills what an agent needs to act correctly.

## Documentation & architecture decisions (read these first)

All project documentation lives in **[`docs/`](docs/README.md)**:

- **[`docs/adr/`](docs/adr/README.md)** — **Architecture Decision Records**,
  the authoritative "why" behind the codebase. **Before changing anything
  architectural, check whether an ADR already covers it; a new architectural
  decision requires a new ADR.** Authoring rules (template, numbering,
  append-only, index) live in [`docs/adr/README.md`](docs/adr/README.md) and
  [`docs.instructions.md`](.github/instructions/docs.instructions.md).
- **[`docs/steps/`](docs/steps/)** — the build narrative: ordered,
  self-contained steps explaining how and why the scaffold was assembled.
  Read in order to build a mental model of the app.
- **[`CONTRIBUTING.md`](CONTRIBUTING.md)** — process: the branching model
  (`develop`/`main`), commit convention, PR checklist.

## What this project is

A production-grade **React scaffold for data-heavy apps with URL-driven
state**. It is a template: it ships infrastructure and seams, not product
features. The core architectural idea is that **the URL is the single source
of truth** for queryable view state (search, sort, pagination).

## Commands

```bash
npm install            # install deps (npm only; package-lock.json is committed)
npm run dev            # Vite dev server
npm test               # vitest run (unit + component tests, jsdom)
npm run test:watch     # vitest watch mode
npm run typecheck      # tsc -b (strict, no emit)
npm run lint           # eslint (flat config)
npm run format         # prettier --write
npm run build          # tsc -b && vite build
```

All four gates — **lint, typecheck, tests, build** — must pass before a PR is
mergeable. Husky + lint-staged run eslint/prettier on staged files at commit
time.

## Stack

Choices only — the rationale for each lives in its ADR:

| Concern    | Choice                                                 | Decision                                                                                                        |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Build      | Vite 6 + `@vitejs/plugin-react-swc`, strict TypeScript | [0001](docs/adr/0001-build-tooling-vite-swc.md), [0002](docs/adr/0002-typescript-strict-and-project-config.md)  |
| State      | Redux Toolkit + reselect; RTK Query (single `baseApi`) | [0007](docs/adr/0007-redux-toolkit-and-rtk-query.md), [0009](docs/adr/0009-reselect-and-listener-middleware.md) |
| Routing    | React Router v6 (IWA-compatible)                       | [0020](docs/adr/0020-routing-react-router-v6-for-iwa-compatibility.md)                                          |
| Validation | Zod for URL search params                              | [0008](docs/adr/0008-zod-total-parsing-of-search-params.md)                                                     |
| Styling    | CSS modules + Tailwind v3 utilities                    | [0021](docs/adr/0021-tailwind-v3-for-iwa-compatibility.md)                                                      |
| i18n       | i18next + react-i18next (`pl`/`en`)                    | [0014](docs/adr/0014-internationalization-i18n.md)                                                              |
| Dates      | date-fns for parsing and comparing calendar dates      | [0036](docs/adr/0036-date-fns-for-calendar-dates.md)                                                            |
| Testing    | Vitest + Testing Library                               | [0005](docs/adr/0005-testing-vitest-testing-library.md)                                                         |
| UI library | IWA Components / PrimeReact behind the `src/ui` seam   | [0013](docs/adr/0013-iwa-components-primereact.md)                                                              |

## Layout

```
src/
├─ app/          # store, typed hooks (useAppSelector/Dispatch), listener middleware, rootReducer
├─ api/          # baseApi — the single RTK Query api; features inject endpoints
├─ dev/          # opt-in dev-only preview data profiles; excluded from production bundles
├─ features/
│  └─ urlState/  # Zod list-query schema (1-based `page`), Redux mirror of the URL,
│                # selectors, <UrlStateSync/>, useListQueryState (write hook)
├─ ui/           # UI seam: IWA re-exports, ScreenHeading, GenericDataTable + cells, DueDateFilter, MenuListAdapter, NavigationIcon, useCustomIcon, PrimeIcon, cx, toast
├─ routes/       # router.tsx, RootLayout, pages/
├─ styles/       # global.css (design tokens as CSS vars + Tailwind layers via PostCSS)
├─ i18n/         # i18next setup + typed messages (pl/en)
└─ test/         # renderWithProviders (store + router + i18n wrapper)
```

Path alias: `@/` → `src/` (configured in `vite.config.ts` and tsconfig).

## Where the rules live

Nothing is repeated here — each topic has exactly one home:

- **Architecture rules ("why" and "what not to break")** — the ADRs in
  [`docs/adr/`](docs/adr/README.md) (see the top of this file).
- **Per-path coding rules ("how")** —
  [`.github/instructions/`](.github/instructions/): `src/**` (TypeScript/React),
  `src/ui/**` (UI seam + styling), tests, `docs/**` (documentation + ADRs).
- **UI primitive contracts and usage examples** —
  [`src/ui/README.md`](src/ui/README.md); everything is exported from
  `src/ui/index.ts` and imported via `@/ui`.

## Process / git conventions

The full process (branching model, commit convention, PR checklist) is
defined once in [`CONTRIBUTING.md`](CONTRIBUTING.md). The essentials:

- Two long-lived branches: **`develop`** (integration) and **`main`**
  (release). Work on `<type>/<kebab-summary>` branches cut from `develop`,
  PR back into `develop` (squash merge); a release is a PR
  `develop` → `main`.
- **Conventional Commits, written in English** (e.g.
  `feat(ui): add useCustomIcon hook`). Body explains _why_.
- **English only, everywhere**: code, commits and documentation. Polish
  appears only in the `pl` locale messages (`src/i18n/messages/pl.ts`).

## Docs map

Beyond `docs/` and `CONTRIBUTING.md` (listed at the top of this file):

| Where                             | What                                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| `README.md`                       | Human landing page: stack, architecture diagram, getting started    |
| `src/ui/README.md`                | The UI seam contract and how to swap in the org library             |
| `.github/copilot-instructions.md` | Repository-wide Copilot instructions (points here)                  |
| `.github/instructions/`           | Path-specific Copilot rules (`applyTo` globs: src, ui, tests, docs) |
