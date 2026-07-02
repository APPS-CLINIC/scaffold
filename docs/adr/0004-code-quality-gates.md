# ADR 0004 — Quality gates: ESLint + Prettier + Husky + lint-staged

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

Quality conventions only hold if they are enforced automatically. We want
**formatting** to be a non-topic, **lint** to catch real correctness problems,
and both to be impossible to forget — without slowing down every commit.

## Decision

We layer four tools with clear, non-overlapping responsibilities:

- **Prettier** owns formatting only. Config in
  [`.prettierrc.json`](../../.prettierrc.json): single quotes, semicolons,
  trailing commas, `printWidth: 100`, 2-space indent. Editor behavior is
  consistent via [`.editorconfig`](../../.editorconfig).
- **ESLint (flat config)** owns code quality, in
  [`eslint.config.js`](../../eslint.config.js): recommended JS +
  `typescript-eslint` rule sets, plus:
  - `react-hooks/rules-of-hooks` (error) and `exhaustive-deps` (warn),
  - `react-refresh/only-export-components` for HMR safety,
  - `@typescript-eslint/consistent-type-imports` (inline `import type`), which
    enforces the `verbatimModuleSyntax` discipline from
    [ADR 0002](0002-typescript-strict-and-project-config.md),
  - `no-unused-vars` with a `^_` ignore escape hatch.
  - **`eslint-config-prettier` is applied last**, so ESLint never fights
    Prettier over formatting.
- **Husky** manages Git hooks; [`.husky/pre-commit`](../../.husky/pre-commit)
  runs `npx lint-staged`. Hooks install via the `prepare` script.
- **lint-staged** ([`package.json`](../../package.json)) runs, on staged
  `*.{ts,tsx}` and in order: `eslint --fix`, then `prettier --write`, then
  `vitest related --run --passWithNoTests` — which runs **only the tests that
  import the staged files**, so the commit is verified without paying for the
  whole suite. Staged `*.{json,css,md,html}` get `prettier --write`. Everything
  runs only on the files you touched.
- **Editor format-on-save** is configured in
  [`.vscode/settings.json`](../../.vscode/settings.json): Prettier is the default
  formatter with `editor.formatOnSave`, and ESLint auto-fixes via
  `source.fixAll.eslint` on save. This shifts formatting/lint left, so the commit
  hook rarely has anything left to fix. The
  [`.vscode/extensions.json`](../../.vscode/extensions.json) recommendations
  (`dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`) provide the extensions it
  relies on.

## Consequences

- A commit is auto-fixed, formatted, and its related tests are run for staged
  files before it lands, so local commits are already close to a green CI.
- Each tool has one job, so they don't clash (especially ESLint vs Prettier).
- The `pre-commit` hook is the only place to update when the package manager
  changes (see [ADR 0003](0003-package-manager-npm.md)).
- Hooks can be bypassed with `--no-verify`; that's why the real gate is still CI
  (which should run the same `npm run lint`/`typecheck`/`test`/`build`).

## Alternatives considered

- **ESLint for formatting too.** Slower and noisier; Prettier is a formatter
  built for the job — hence the strict split.
- **Biome** (one fast lint+format tool) — tempting, but the ESLint plugin
  ecosystem for TypeScript/React is still richer for this scaffold.
- **No pre-commit hook, CI only.** Pushes trivial formatting failures to CI and
  slows the loop.
