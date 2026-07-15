# Step 01 — Scaffold and configuration

> **Goal:** establish the toolchain, language configuration, quality gates, and
> project process — the foundation that every subsequent step builds on.

This step documents the _configuration layer_ of the scaffold: everything that
governs how code is built, typed, linted, tested, and contributed — before any
application architecture exists (that is [Step 02](02-app-architecture.md)).

## What this step establishes

| Area                   | Files                                                                                           | ADR                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Build / dev / HMR      | `vite.config.ts`, `index.html`                                                                  | [0001](../adr/0001-build-tooling-vite-swc.md)               |
| Language configuration | `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`                                      | [0002](../adr/0002-typescript-strict-and-project-config.md) |
| Package manager        | `package.json`, `package-lock.json`, `.nvmrc`                                                   | [0003](../adr/0003-package-manager-npm.md)                  |
| Quality gates          | `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.husky/pre-commit` | [0004](../adr/0004-code-quality-gates.md)                   |
| Testing                | `vite.config.ts` (`test`), `vitest.setup.ts`                                                    | [0005](../adr/0005-testing-vitest-testing-library.md)       |
| Environment / editor   | `.env.example`, `.gitignore`, `.vscode/extensions.json`                                         | —                                                           |
| Process                | `CONTRIBUTING.md`                                                                               | —                                                           |

## How the pieces fit together

```
            ┌──────────────┐
   git commit ─▶│ Husky hook │─▶ lint-staged ─▶ eslint --fix + prettier --write
            └──────────────┘                      (staged files only)

   npm run dev   ─▶ Vite + SWC ──▶ HMR
   npm run build ─▶ tsc -b (typecheck) ─▶ vite build ─▶ dist/ (vendor chunks)
   npm test      ─▶ Vitest (jsdom) ─▶ Testing Library
```

- **Vite** is a single engine for the dev server, the production build, _and_
  (via `vitest/config`) the test runner — one configuration, no drift.
- **TypeScript** runs strict, split into `app` (browser) and `node`
  (configuration) projects under a single `tsconfig.json`.
- **ESLint + Prettier** have separate jobs (quality vs formatting) and do not
  fight each other thanks to `eslint-config-prettier` applied last.
- **Husky + lint-staged** make checks on staged files automatic at commit
  time.
- **npm** pins the toolchain (`package-lock.json`, `engines`, `.nvmrc`).

The rationale for each choice lives in its ADR — this document is the map; the
ADRs are the territory.

## Verifying this step

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

Development follows **GitHub Flow**: `main` stays deployable at all times, and
this step lands as the `docs/scaffold-and-config` branch via a Pull Request.
The full branching model, commit convention, and PR checklist are in
[`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
