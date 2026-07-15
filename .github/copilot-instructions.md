# Copilot repository instructions

## Project

Production-grade React scaffold for data-heavy apps with **URL-driven state**:
Vite 6 + TypeScript (strict), Redux Toolkit + RTK Query, React Router v7, Zod,
i18next, Tailwind v4 utilities, Vitest + Testing Library. It is a template —
infrastructure and seams, not product features.

The canonical agent guide is [`AGENTS.md`](../AGENTS.md) (commands, layout,
architecture rules, docs map). Path-specific rules live in
[`.github/instructions/`](instructions/) (`applyTo` globs for `src/**`,
`src/ui/**`, tests and `docs/**`).

## Build and validate

- Install with `npm ci` (npm only, lockfile is committed; Node from `.nvmrc`).
- Before proposing or finishing any change, run all four gates and make them
  pass: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Format with Prettier (`npm run format`); do not hand-format.

## Core rules

- The **URL is the single source of truth** for list/view state. Sync is
  one-directional (URL → Redux via `<UrlStateSync/>`). Write query state only
  through `useListQueryState().setQuery`; never write the `urlState` slice
  directly and never sync store → URL.
- Zod parsing of search params is **total**: every schema field carries a
  `.catch()` default. `page` is **1-based**.
- Import UI components only from `@/ui` — it is a seam for the org UI library
  (IWA / PrimeReact); keep its exported names and prop contracts stable.
- Inject RTK Query endpoints onto the single `baseApi`; never create a second
  `createApi`.
- Use `import type` for type-only imports (`verbatimModuleSyntax` is on).
- Style with Tailwind v4 utilities and the CSS-variable design tokens from
  `src/styles/global.css` (preflight is intentionally not imported).
- All user-facing text goes through i18next with messages in both `pl` and
  `en`.

## Documentation and decisions

- Docs live in `docs/` (Polish): build narrative in `docs/steps/`,
  **Architecture Decision Records in `docs/adr/`** (indexed in
  `docs/adr/README.md`). Consult the ADRs before architectural changes;
  record any new architectural decision as a new, numbered ADR and add it to
  the index. ADRs are append-only.

## Conventions

- GitHub Flow: short-lived branches off `main` named `<typ>/<kebab-summary>`
  (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`); squash merge.
- Commits follow **Conventional Commits written in Polish**, e.g.
  `feat(ui): komponent Icon i hook useCustomIcon`.
- Tests are co-located `*.test.ts(x)`; assert behavior and ARIA semantics via
  Testing Library, not implementation details.
