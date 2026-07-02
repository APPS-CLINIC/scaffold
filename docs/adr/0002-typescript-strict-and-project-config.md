# ADR 0002 — Strict TypeScript with project references

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

This is a data-heavy app where many bugs are data-shape bugs — an undefined row,
a mistyped query field, a stale enum. We want the compiler to catch as many of
these as possible, and we want type-checking in the editor/CLI to be fast and to
cover both the application code (browser globals) and the Node config files
(different globals).

## Decision

We run TypeScript in **strict mode plus extra safety flags**, split via
**project references**.

[`tsconfig.json`](../../tsconfig.json) is a solution file with no sources of its
own; it references two leaf projects:

- [`tsconfig.app.json`](../../tsconfig.app.json) — the `src` application, `lib`
  includes DOM, browser globals.
- [`tsconfig.node.json`](../../tsconfig.node.json) — `vite.config.ts`, Node
  libs and globals.

Beyond `"strict": true`, the app project additionally enables:

- **`noUncheckedIndexedAccess`** — `arr[i]` is `T | undefined`. Crucial for row
  access in virtualization/pagination.
- **`noUnusedLocals` / `noUnusedParameters`** — dead code is an error.
- **`noFallthroughCasesInSwitch`**, **`noImplicitOverride`**,
  **`noUncheckedSideEffectImports`**.
- **`verbatimModuleSyntax`** — forces explicit `import type`, which keeps type
  imports from leaking into the JS output and pairs with the ESLint rule
  `consistent-type-imports` (see [ADR 0004](0004-code-quality-gates.md)).
- **`moduleResolution: "bundler"`** + the path alias `@/* → ./src/*`, matching
  Vite.

`npm run typecheck` is `tsc -b`, which builds the referenced projects with
incremental `.tsbuildinfo` caches.

## Consequences

- A large class of runtime errors becomes a compile error.
- `noUncheckedIndexedAccess` forces explicit "might be missing" handling — more
  verbose, but honest, especially around list/row access.
- App and Node code cannot accidentally use each other's globals.
- Incremental builds keep `typecheck` fast after the first run.

## Alternatives considered

- **A single loose `tsconfig.json`.** Simpler, but mixes browser/Node lib types
  and gives up the safety net of the strict flags.
- **`strict` alone, without the extra flags.** Leaves unchecked index access and
  dead code — exactly the bugs this app is prone to.
