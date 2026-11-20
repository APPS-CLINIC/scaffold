# ADR 0051 — Storybook for tables and shared list controls

- **Status:** Accepted
- **Date:** 2026-11-10
- **Refines:** ADR 0013, ADR 0047, ADR 0048 and ADR 0049

## Context

The development Facilities route exercises application integration, but one
route is inconvenient for reviewing all shared table controls and their states.
The catalogue must render existing components and realistic lazy data without
duplicating the feature owner or leaking story state into another example.

## Decision

- Use Storybook 10 with its React/Vite framework, Docs and accessibility addons.
  Use the supported Vitest addon and Playwright browser provider for CSF play
  tests. Update Vitest/coverage together to compatible v4 releases and keep the
  existing unit suite separate from browser tests.
- Keep stories and synthetic scenario adapters under `src/stories`. Use the
  application components from `@/ui` and the existing Facilities preview owner.
  The integration route remains available until a production route replaces it.
- Give every Canvas/Docs instance its own Redux store, MemoryRouter, URL sync,
  cloned i18n instance and PrimeReact/toast providers. Do not connect preference
  persistence or register application-wide browser listeners. Abort pending
  requests and clear that instance's cache on unmount.
- Add optional store-factory configuration for thunk dependencies and browser
  event listeners. Defaults retain application behavior. The development-only
  Facilities endpoints read a per-store transport from RTK Query's `extra`, with
  the existing transport as their default. No module-global story mocks or
  second API instance are introduced.
- Parameterize the pure development service by its catalogue and sibling-page
  sizes. Use the same filtering, DTO mapping and async transport for default,
  slow, empty, first-request failure/retry and large-catalogue scenarios. Large
  examples expose bounded pages, not a complete nested response.
- Use a separate Storybook Vite configuration for aliases and the existing
  stylesheet stack. It imports the real private UI packages and never imports
  Vitest's test-double aliases. Storybook output is ignored by source control.

## Consequences

Tables, controls, feedback and cells have reproducible examples and interaction
assertions. Generic table owners demonstrate URL-driven paging/sort/filters and
controlled settings; Facilities exercises the same async lifecycle as the app.
Play assertions read the selected locale's real translations.

Vitest portable-story smoke tests use the existing test-only design-system
aliases. They validate scenario wiring and behavior, not the actual IWA visuals.
Full Storybook rendering/build, browser play tests and accessibility verification
require the private packages. Missing dependencies must remain visible failures.
No production replacements or fake declarations are added.

The mock data is not a production performance benchmark. HTTP/MSW integration
waits for an agreed backend contract; the current queryFn transport performs no
HTTP requests. Storybook is not imported by the application's route tree.

## Alternatives considered

- Keep every scenario as an application route: duplicates preview navigation.
- Recreate the tables in stories: makes catalogue and application drift.
- Seed a complete tree into every story: fails to exercise lazy loading.
- Share a singleton mock/store: contaminates concurrent Docs examples.
- Alias IWA to test doubles in Storybook: produces an inaccurate visual preview.

- Legacy Storybook test-runner: its official support has ended; use the supported Vitest addon.
