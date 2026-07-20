# ADR 0002 — Strict TypeScript with project references

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

This is a data-heavy application in which many bugs are data-shape bugs — an undefined row, a mistyped query field, a stale enum. We want the compiler to catch as much of this as possible, and we want editor/CLI type checking to be fast and to cover both application code (DOM globals) and Node config files (different globals).

## Decision

We run TypeScript in **strict mode plus additional safety flags**, split via **project references**.

[`tsconfig.json`](../../tsconfig.json) is a solution-style file with no sources of its own; it references two leaf projects:

- [`tsconfig.app.json`](../../tsconfig.app.json) — the `src` application; `lib`
  includes DOM, browser globals.
- [`tsconfig.node.json`](../../tsconfig.node.json) — `vite.config.ts`, Node
  libraries and globals.

Beyond `"strict": true`, the app project additionally enables:

- **`noUncheckedIndexedAccess`** — `arr[i]` is `T | undefined`. Crucial when
  accessing rows in virtualization/pagination.
- **`noUnusedLocals` / `noUnusedParameters`** — dead code is an error.
- **`noFallthroughCasesInSwitch`**, **`noImplicitOverride`**,
  **`noUncheckedSideEffectImports`**.
- **`verbatimModuleSyntax`** — forces explicit `import type`, which keeps type
  imports from leaking into the JS output and pairs with the ESLint rule
  `consistent-type-imports` (see [ADR 0004](0004-code-quality-gates.md)).
- **`moduleResolution: "bundler"`** + the path alias `@/* → ./src/*`, matching
  Vite.

`npm run typecheck` is `tsc -b`, which builds the referenced projects with incremental `.tsbuildinfo` caches.

## Consequences

- A large class of runtime bugs becomes a compile error.
- `noUncheckedIndexedAccess` forces explicit handling of "might be missing" —
  more verbose, but honest, especially around list/row access.
- Application and Node code can't accidentally use each other's globals.
- Incremental builds keep `typecheck` fast after the first run.

## Alternatives considered

- **A single loose `tsconfig.json`.** Simpler, but mixes browser/Node lib types
  and gives up the safety net of the strict flags.
- **`strict` alone, without the extra flags.** Leaves unchecked indexed access
  and dead code in place — exactly the bugs this application is prone to.
