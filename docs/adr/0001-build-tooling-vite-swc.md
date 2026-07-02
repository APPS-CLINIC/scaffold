# ADR 0001 — Vite 6 + SWC as build and dev tooling

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

We need a build/dev toolchain for a browser SPA that provides a fast feedback
loop (HMR), a sensible production build with code splitting, and first-class
TypeScript + JSX support — without hand-writing bundler configuration.

## Decision

We use **Vite 6** with **`@vitejs/plugin-react-swc`**.

Concretely, from [`vite.config.ts`](../../vite.config.ts):

- **SWC** (Rust) compiles React/TSX instead of Babel — faster cold start and HMR.
- The **path alias** `@ → ./src` is defined once here and mirrored in
  `tsconfig.app.json`, so imports read `@/features/...` rather than `../../../`.
- **Build target `es2022`** with **sourcemaps** enabled.
- **Manual vendor chunks** split rarely-changing dependencies into durable,
  cacheable files:
  - `react-vendor`: `react`, `react-dom`, `react-router-dom`
  - `redux-vendor`: `@reduxjs/toolkit`, `react-redux`, `reselect`
- The config is imported from **`vitest/config`**, so the same file also
  configures the test runner (see
  [ADR 0005](0005-testing-vitest-testing-library.md)).

## Consequences

- Very fast dev server and HMR; minimal configuration to maintain.
- A returning user after a deploy re-downloads only the app chunks, not the whole
  vendor bundle — but the manual chunk list must be updated when key
  dependencies change.
- A single config object drives both build and tests, eliminating drift between
  them.

## Alternatives considered

- **Create React App** — effectively unmaintained; slow; opaque configuration.
- **Next.js** — excellent, but brings SSR/routing/server conventions this
  data-heavy SPA does not need; heavier mental model.
- **Webpack from scratch** — maximum control, maximum maintenance cost.
- **Babel-based `@vitejs/plugin-react`** — fine, but SWC is faster and we use no
  Babel-only transforms.
