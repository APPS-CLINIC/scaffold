# Step 01 — Scaffold and configuration

> **Goal:** establish the toolchain, language config, quality gates, and project
> process — the foundation every later step builds on.

This step documents the scaffold's _configuration layer_: everything that
governs how code is built, typed, checked, tested, and contributed — before any
application architecture exists (that is [Step 02](02-app-architecture.md)).

## What this step establishes

| Area                 | Files                                                                                           | ADR                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Build / dev / HMR    | `vite.config.ts`, `index.html`                                                                  | [0001](../adr/0001-build-tooling-vite-swc.md)               |
| Language config      | `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`                                      | [0002](../adr/0002-typescript-strict-and-project-config.md) |
| Package manager      | `package.json`, `package-lock.json`, `.nvmrc`                                                   | [0003](../adr/0003-package-manager-npm.md)                  |
| Quality gates        | `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.husky/pre-commit` | [0004](../adr/0004-code-quality-gates.md)                   |
| Testing              | `vite.config.ts` (`test`), `vitest.setup.ts`                                                    | [0005](../adr/0005-testing-vitest-testing-library.md)       |
| Environment / editor | `.env.example`, `.gitignore`, `.vscode/extensions.json`                                         | —                                                           |
| Process              | `CONTRIBUTING.md`                                                                               | —                                                           |

## How the pieces fit together

```
            ┌──────────────┐
   git commit ─▶│ Husky hook │─▶ lint-staged ─▶ eslint --fix + prettier --write
            └──────────────┘                      (staged files only)

   npm run dev   ─▶ Vite + SWC ──▶ HMR
   npm run build ─▶ tsc -b (typecheck) ─▶ vite build ─▶ dist/ (vendor chunks)
   npm test      ─▶ Vitest (jsdom) ─▶ Testing Library
```

- **Vite** is the single engine for the dev server, the production build, _and_
  (via `vitest/config`) the test runner — one config, no drift.
- **TypeScript** runs strict, split into `app` (browser) and `node` (config)
  projects under one `tsconfig.json`.
- **ESLint + Prettier** have separate jobs (quality vs formatting) and do not
  fight thanks to applying `eslint-config-prettier` last.
- **Husky + lint-staged** make staged-file checks automatic on commit.
- **npm** pins the toolchain (`package-lock.json`, `engines`, `.nvmrc`).

The rationale for each choice lives in its ADR — this document is the map; the
ADRs are the terrain.

## Verifying the step

A clean checkout should pass every gate:

```bash
npm install       # installs dependencies + Git hooks (prepare → husky)
npm run lint      # ESLint, no errors
npm run typecheck # tsc -b, no errors
npm test          # Vitest, green
npm run build     # typecheck + production build to dist/
```

If all five pass, the foundation is solid and [Step 02 — Application
architecture](02-app-architecture.md) can build on it.

## Process

Development follows **GitHub Flow**: `main` stays always deployable, and this
step lands as a `docs/scaffold-and-config` branch via Pull Request. The full
branch model, commit convention, and PR checklist are in
[`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
