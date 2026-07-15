# AGENTS.md — guide for AI coding agents

This file gives coding agents (GitHub Copilot, Claude Code, etc.) a complete,
trustworthy picture of this repository. Read it before making changes.
Human-facing docs live in [`README.md`](README.md) and [`docs/`](docs/README.md);
this file distills what an agent needs to act correctly.

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

## Styling

- Design tokens are CSS custom properties in `src/styles/global.css`
  (`--border`, `--surface`, `--surface-muted`, `--muted`, `--accent`, …).
- Tailwind v4 is wired via `@tailwindcss/vite`; only the **theme** and
  **utilities** layers are imported — **no preflight**, so the hand-written
  global styles stay the base. Reference tokens from utilities as
  `bg-[var(--surface)]`, `border-[var(--border)]`, etc.
- Older primitives use CSS modules (`ui.module.css`); newer ones (e.g. `Icon`)
  are Tailwind-only. Either is acceptable in `src/ui`; features should not
  need custom CSS.
- `cx()` from `@/ui` joins class names (filters falsy values).

## UI primitives cheat-sheet

- `Button`, `TextInput`, `Select` — thin placeholders, keep prop contracts.
- `ToastProvider` + `useToast()` — imperative notifications.
- `Icon` — circular (`rounded-full`) badge with a centered glyph. Props:
  `size` (`sm|md|lg|xl`), `tone` (`outline|neutral|accent`), `label`
  (accessible name; omitted ⇒ `aria-hidden`). SVG children auto-scale to ~55%
  of the circle and inherit `currentColor`.
- `useCustomIcon(icon, options?)` — binds a glyph + default options into a
  reusable component: `const UserIcon = useCustomIcon(<UserSvg />, { size: 'lg' })`,
  then `<UserIcon tone="accent" />`. Keep the icon element referentially
  stable (hoist it) to preserve component identity.

## Testing conventions

- Component tests use Testing Library; wrap connected components with
  `renderWithProviders` (`src/test/renderWithProviders.tsx`).
- Pure UI (like `Icon`) uses plain `render` from `@testing-library/react`.
- Tests live next to the code as `*.test.ts(x)`; jsdom environment, globals on.
- Assert behavior/ARIA, not implementation; class-name assertions are used
  only for Tailwind-styled primitives where classes _are_ the contract.

## Process / git conventions

- **GitHub Flow**: short-lived branches off `main`, PR + green CI + review,
  squash merge. `main` is protected.
- Branch names: `<typ>/<kebab-summary>` (`feat/`, `fix/`, `chore/`, `docs/`,
  `refactor/`, `test/`).
- **Conventional Commits, written in Polish** (e.g.
  `feat(ui): komponent Icon i hook useCustomIcon`). Body explains _why_.
- Architecture decisions are recorded as ADRs in `docs/adr/` (Polish,
  append-only — new decision supersedes, never edit an accepted ADR). The
  step-by-step build narrative lives in `docs/steps/`.

## Docs map

| Where                             | What                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `README.md`                       | Stack, architecture diagram, getting started (EN)         |
| `CONTRIBUTING.md`                 | GitHub Flow, commit/branch conventions, PR checklist (PL) |
| `docs/steps/`                     | Build narrative, ordered steps (PL)                       |
| `docs/adr/`                       | Architecture Decision Records, indexed in its README (PL) |
| `src/ui/README.md`                | The UI seam contract and how to swap in the org library   |
| `.github/copilot-instructions.md` | Short Copilot pointer to this file                        |
