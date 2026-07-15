# ADR 0004 — Quality gates: ESLint + Prettier + Husky + lint-staged

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

Quality conventions only hold when they are enforced automatically. We want **formatting** to be a non-topic, **linting** to catch real correctness issues, and both to be impossible to forget — without slowing down every commit.

## Decision

We layer four tools with clear, non-overlapping responsibilities:

- **Prettier** is solely responsible for formatting. Configuration in
  [`.prettierrc.json`](../../.prettierrc.json): single quotes, semicolons,
  trailing commas, `printWidth: 100`, 2-space indentation. Editor behavior is
  kept consistent via [`.editorconfig`](../../.editorconfig).
- **ESLint (flat config)** is responsible for code quality, in
  [`eslint.config.js`](../../eslint.config.js): the recommended JS +
  `typescript-eslint` rule sets, plus:
  - `react-hooks/rules-of-hooks` (error) and `exhaustive-deps` (warn),
  - `react-refresh/only-export-components` for HMR safety,
  - `@typescript-eslint/consistent-type-imports` (inline `import type`), which
    enforces the `verbatimModuleSyntax` discipline from
    [ADR 0002](0002-typescript-strict-and-project-config.md),
  - `no-unused-vars` with an escape hatch ignoring `^_`.
  - **`eslint-config-prettier` is applied last**, so ESLint never fights
    Prettier over formatting.
- **Husky** manages Git hooks; [`.husky/pre-commit`](../../.husky/pre-commit)
  runs `npx lint-staged`. Hooks are installed via the `prepare` script.
- **lint-staged** ([`package.json`](../../package.json)) runs `eslint --fix`
  and then `prettier --write` on staged `*.{ts,tsx}`, and `prettier --write`
  on staged `*.{json,css,md,html}` — that is, only on the files you touched.

## Consequences

- A commit is auto-fixed and formatted for the staged files before it lands, so
  local commits are already close to a green CI.
- Each tool has one job, so they don't clash (especially ESLint vs Prettier).
- The `pre-commit` hook is the only place to update when the package manager
  changes (see [ADR 0003](0003-package-manager-npm.md)).
- Hooks can be bypassed with `--no-verify`; that's why CI remains the real gate
  (the same `npm run lint`/`typecheck`/`test`/`build` should run there).

## Alternatives considered

- **ESLint for formatting too.** Slower and noisier; Prettier is a formatter
  built for the purpose — hence the strict split.
- **Biome** (one fast tool for lint+format) — tempting, but the ESLint plugin
  ecosystem for TypeScript/React is still richer for a scaffold.
- **No pre-commit hook, CI only.** Pushes trivial formatting failures to CI and
  slows down the loop.
