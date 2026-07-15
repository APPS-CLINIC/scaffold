# ADR 0005 — Vitest + Testing Library for testing

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

We want a test runner that shares the Vite configuration with the app (no second build pipeline to keep in sync), runs fast, and supports both pure logic tests (schema parsing, query mocking) and component/interaction tests.

## Decision

We use **Vitest** with **@testing-library/react** + **user-event** and **@testing-library/jest-dom**.

From the `test` block in [`vite.config.ts`](../../vite.config.ts):

- **`environment: 'jsdom'`** for DOM-based component tests.
- **`globals: true`**, so `describe/it/expect` need no imports; the matching
  types are wired up via `tsconfig.app.json` `types: ["vitest/globals", ...]`.
- **`setupFiles: ['./vitest.setup.ts']`** registers the jest-dom matchers.
- **`restoreMocks: true`** isolates tests by automatically resetting mocks.
- **Coverage** via `@vitest/coverage-v8`, including `src/**` and excluding
  tests, `main.tsx`, and `.d.ts` files.

Tests live next to the code they cover (`*.test.ts(x)`), and components are rendered through a shared helper, `src/test/renderWithProviders.tsx`, which wires up the Redux store and the router (see [Step 02](../steps/02-app-architecture.md)).

## Consequences

- One configuration drives dev, build, and tests — no parallel Jest/Babel
  configuration.
- Co-located tests keep coverage close to the code and easy to find.
- The store factory (`makeStore`) makes every test hermetic — a fresh store per
  test, optionally with preloaded state.

## Alternatives considered

- **Jest** — mature, but requires its own transform/configuration and is slower
  with Vite/ESM/TS; duplicates what Vite already knows.
- **Playwright/Cypress only.** Great for end-to-end, but too heavy and slow as
  the primary unit/component layer; complementary, not a replacement.
