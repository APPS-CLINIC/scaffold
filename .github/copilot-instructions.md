# Copilot instructions

Read [`AGENTS.md`](../AGENTS.md) in the repository root first — it is the
canonical, always-current guide for AI agents working in this codebase
(commands, architecture rules, conventions, docs map).

Documentation lives in `docs/` — the build narrative in `docs/steps/` and
**architecture decisions (ADRs) in `docs/adr/`** (indexed in
`docs/adr/README.md`). Check the ADRs before architectural changes; record new
architectural decisions as new ADRs.

Non-negotiables, in short:

- The **URL is the single source of truth** for list/view state; sync is
  one-directional (URL → Redux via `<UrlStateSync/>`). Never write the
  `urlState` slice directly or sync store → URL.
- Zod parsing of search params must stay **total** (`.catch()` defaults on
  every field); `page` is **1-based**.
- Import UI only from `@/ui` (it is a seam for the org UI library); keep its
  exported names and prop contracts stable.
- Inject RTK Query endpoints onto the single `baseApi`; never add a second
  `createApi`.
- TypeScript is strict with `verbatimModuleSyntax` — use `import type` for
  type-only imports.
- Styling: Tailwind v4 utilities + CSS-variable design tokens from
  `src/styles/global.css` (no preflight); `cx()` joins class names.
- Quality gates for every PR: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`. Commits: Conventional Commits in Polish.
