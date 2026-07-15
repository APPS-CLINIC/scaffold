# AGENTS.md — guide for AI coding agents

This file gives coding agents (GitHub Copilot, Claude Code, etc.) a complete,
trustworthy picture of this repository. Read it before making changes.
Human-facing docs live in [`README.md`](README.md) and [`docs/`](docs/README.md);
this file distills what an agent needs to act correctly.

## Documentation & architecture decisions (read these first)

All project documentation lives in **[`docs/`](docs/README.md)**:

- **[`docs/adr/`](docs/adr/README.md)** — **Architecture Decision Records**:
  one accepted decision per file, indexed in
  [`docs/adr/README.md`](docs/adr/README.md). This is the authoritative "why"
  behind the codebase. **Before changing anything architectural, check whether
  an ADR already covers it; when you introduce a new architectural decision,
  add a new ADR** (numbered, using ADR 0000 as the template) and register it
  in the index. ADRs are append-only — never edit an accepted one; a new ADR
  supersedes the old.
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

| Concern    | Choice                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build      | Vite 6 + `@vitejs/plugin-react-swc`, TypeScript strict                                                                                                    |
| State      | Redux Toolkit + reselect; server cache via RTK Query (single `baseApi`)                                                                                   |
| Routing    | React Router v7                                                                                                                                           |
| Validation | Zod — _total_ parsing of URL search params (`.catch()` per field)                                                                                         |
| Styling    | CSS modules + **Tailwind v4 utilities** (theme+utilities layers only — preflight is deliberately not imported; `src/styles/global.css` is the base layer) |
| i18n       | i18next + react-i18next (`src/i18n`, messages in `pl`/`en`)                                                                                               |
| Testing    | Vitest + Testing Library (`src/test/renderWithProviders.tsx`)                                                                                             |
| UI library | **None bundled** — `src/ui` is a seam for the org library (target: IWA Components / PrimeReact, see ADR 0013)                                             |

## Layout

```
src/
├─ app/          # store, typed hooks (useAppSelector/Dispatch), listener middleware, rootReducer
├─ api/          # baseApi — the single RTK Query api; features inject endpoints
├─ features/
│  └─ urlState/  # Zod list-query schema (1-based `page`), Redux mirror of the URL,
│                # selectors, <UrlStateSync/>, useListQueryState (write hook)
├─ ui/           # UI seam: Button, TextInput, Select, Toast, Icon + useCustomIcon, cx()
├─ routes/       # router.tsx, RootLayout, pages/
├─ styles/       # global.css (design tokens as CSS vars + Tailwind theme/utilities import)
├─ i18n/         # i18next setup + typed messages (pl/en)
└─ test/         # renderWithProviders (store + router + i18n wrapper)
```

Path alias: `@/` → `src/` (configured in `vite.config.ts` and tsconfig).

## Architecture rules (do not break these)

1. **URL → Redux is one-directional.** Writes go through `useListQueryState`'s
   `setQuery` → `setSearchParams`; `<UrlStateSync/>` mirrors the URL back into
   the `urlState` slice. Never write the slice directly from components and
   never sync store → URL.
2. **Search-param parsing is total.** Every field in `listQuerySchema` has a
   `.catch()` default — a malformed URL must never crash the app. Keep this
   property when extending the schema.
3. **Pagination is 1-based** in queries (`page: min(1)`, default `1`). Convert
   to 0-based at the API-client layer if a backend needs it.
4. **All UI imports go through `@/ui`.** Feature/route code must not import a
   vendor UI library directly; the seam exists so the org library (IWA /
   PrimeReact) can be swapped in one folder. Keep exported names and prop
   contracts stable.
5. **One RTK Query api.** New endpoints are injected onto `baseApi`
   (`injectEndpoints`), never created as a second `createApi`.
6. **Strict TS everywhere** — `verbatimModuleSyntax` is on, so use
   `import type { ... }` for type-only imports; `noUncheckedIndexedAccess`
   means indexed access yields `T | undefined`.

## Styling, UI primitives, testing — where the rules live

To keep a single source of truth, the detailed rules are NOT repeated here:

- **Styling** — [`.github/instructions/ui.instructions.md`](.github/instructions/ui.instructions.md)
  and [ADR 0019](docs/adr/0019-tailwind-utilities.md). In short: Tailwind v4
  utilities only (no preflight), design tokens as CSS variables from
  `src/styles/global.css` (`bg-[var(--surface)]`), class names joined with
  `cx()`, no CSS in feature code.
- **UI primitives** (`Button`, `TextInput`, `Select`, Toast, `Icon`,
  `useCustomIcon`) — contracts and usage examples in
  [`src/ui/README.md`](src/ui/README.md); everything is exported from
  `src/ui/index.ts` and imported via `@/ui`.
- **Testing** — [`.github/instructions/tests.instructions.md`](.github/instructions/tests.instructions.md).
  In short: Vitest + Testing Library (jsdom), co-located `*.test.ts(x)`,
  `renderWithProviders` for connected components, assert behavior/ARIA.

## Process / git conventions

The full process (branching model, commit convention, PR checklist) is
defined once in [`CONTRIBUTING.md`](CONTRIBUTING.md). The essentials:

- Two long-lived branches: **`develop`** (integration) and **`main`**
  (release). Work on `<type>/<kebab-summary>` branches cut from `develop`,
  PR back into `develop` (squash merge); a release is a PR
  `develop` → `main`.
- **Conventional Commits, written in English** (e.g.
  `feat(ui): add Icon component and useCustomIcon hook`). Body explains _why_.
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
