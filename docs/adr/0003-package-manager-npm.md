# ADR 0003 — npm as the package manager

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

We want reproducible installs, a simple and ubiquitous tool, and a single agreed
package manager so lockfiles don't "flicker" between people and CI environments.

## Decision

We use **npm** with a committed `package-lock.json`. Node is pinned via
[`.nvmrc`](../../.nvmrc) and the `engines.node` field in
[`package.json`](../../package.json) (`>=20.11`).

- The `prepare` script runs `husky`, so hooks install on `npm install` (see
  [ADR 0004](0004-code-quality-gates.md)).
- The **`overrides`** field in `package.json` pins `vite` to a single version
  across the whole tree (`"vite": "$vite"` — npm supports the `$<name>`
  reference to a version from its own dependencies). This makes the
  `@vitejs/plugin-react-swc` plugin and the app use the same Vite instance —
  without it, npm can install two Vite versions, producing a `Plugin`/`PluginOption`
  type mismatch.
- In CI we use **`npm ci`** (deterministic install strictly from
  `package-lock.json`).

## Consequences

- npm is ubiquitous — no extra tool to install; everyone has it with Node.
- `package-lock.json` + `npm ci` give reproducible, deterministic installs in CI.
- `engines.node` + `.nvmrc` make the expected Node version explicit.
- `node_modules` is flat and larger than pnpm's (no shared, content-addressed
  store) — an acceptable cost for simplicity and one fewer tool dependency.
- The `overrides` field must be maintained when the Vite version changes.

## Alternatives considered

- **pnpm** — faster, content-addressed store and strict `node_modules`, but adds
  another tool to install/pin. Here we choose npm's ubiquity.
- **Yarn (Berry/PnP)** — capable, but PnP introduces editor/tooling friction for
  a scaffold that is meant to be an unsurprising starting point.
