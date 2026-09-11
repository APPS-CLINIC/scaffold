---
description: 'Testing conventions (Vitest + Testing Library)'
applyTo: 'src/**/*.test.{ts,tsx}'
---

# Testing conventions

- Vitest with globals and jsdom; setup lives in `vitest.setup.ts`
  (jest-dom matchers are available).
- Tests are co-located with the code under test as `*.test.ts(x)`.
- Components that need the store, router or i18n are rendered with
  `renderWithProviders` from `src/test/renderWithProviders.tsx`; pure UI
  primitives use plain `render` from `@testing-library/react`.
- Query the DOM the Testing Library way: prefer `getByRole` /
  `getByLabelText` / `getByText`; use `data-testid` only when no accessible
  query fits.
- Simulate users with `@testing-library/user-event`, not `fireEvent`.
- Assert observable behavior and ARIA semantics, not implementation details.
  Exception: for Tailwind-styled primitives in `src/ui`, key classes (e.g.
  `rounded-full`) are the visual contract and may be asserted.
- No snapshot tests; write explicit assertions.
- Keep tests deterministic: no real timers, network or randomness — mock at
  the boundary (`vi.mock`, RTK Query mocks) and prefer fake timers.
- Tests never load the real IWA package: `vite.config.ts` aliases it to
  `src/test/iwaDouble/index.js` for the test run only. Type checking and the
  build still use the real package. Keep the double faithful to what the library
  renders — tests query it by role and accessible name, so a shape that drifts
  makes them assert a fiction.
- Needing a different fake for one file is rare; when a prop is not visible in
  the rendered output, override just that component and spread the rest:
  `vi.mock('iwa-react-components', async (importOriginal) => ({ ...(await
importOriginal<typeof IwaComponents>()), Status: ... }))`. `importOriginal`
  resolves to the double, so nothing loads the library.
- Never mock `'@/ui'`. A factory replaces the whole module, and `@/ui` is a
  barrel that also exports this repo's own primitives (`createPrimeIcon`,
  `PrimeIcon`, `cx`, the adapters). Faking the barrel deletes them, and any
  module in the graph that reaches one dies with `No "<name>" export is defined
on the "@/ui" mock`, far from the mock that caused it. Mock the barrel only to
  fake a local primitive on purpose, as `ContextualSidebar.test.tsx` does; then
  the factory owes every name the graph touches.
- Prefer needing no mock at all: a unit whose module graph never reaches `@/ui`
  (see `cells/cellFormatting.test.tsx`) cannot break when the library changes.
