# Copilot repository instructions

Production-grade React scaffold for data-heavy apps with **URL-driven state**:
Vite 6 + TypeScript (strict), Redux Toolkit + RTK Query, React Router v7, Zod,
i18next, Tailwind v4 utilities, Vitest + Testing Library.

## Single sources of truth

Read these instead of guessing — each topic is defined exactly once:

- [`AGENTS.md`](../AGENTS.md) — the canonical agent guide: commands, stack,
  project layout, **architecture rules**, docs map.
- [`.github/instructions/`](instructions/) — path-specific rules applied via
  `applyTo` globs: `src/**` (TypeScript/React), `src/ui/**` (UI seam +
  Tailwind), tests, `docs/**` (documentation + ADRs).
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — process: branching model
  (`develop` = integration, `main` = release), Conventional Commits,
  PR checklist.
- [`docs/adr/`](../docs/adr/README.md) — architecture decisions; consult
  before architectural changes, record new decisions as new ADRs.

## Build and validate

- Install with `npm ci` (npm only; Node version from `.nvmrc`).
- All four gates must pass before finishing any change: `npm run lint`,
  `npm run typecheck`, `npm test`, `npm run build`.
- Format with Prettier (`npm run format`); do not hand-format.
- Everything is written in English; Polish appears only in the `pl` locale
  messages (`src/i18n/messages/pl.ts`).
