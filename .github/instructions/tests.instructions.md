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
- To fake an IWA component, mock `'iwa-react-components'`, not `'@/ui'`. A
  factory replaces the entire module, and `@/ui` is a barrel that also exports
  this repo's own primitives (`createPrimeIcon`, `PrimeIcon`, `cx`, the
  adapters). Faking the barrel deletes them, and any module in the graph that
  reaches one dies with `No "<name>" export is defined on the "@/ui" mock`.
  Mock the barrel only when the point is to fake a local primitive too, as
  `ContextualSidebar.test.tsx` does; then the factory owes every name the graph
  touches. A vendor factory owes only the vendor names it touches, `twMerge`
  included — it is used by most primitives.
- Prefer needing no mock at all: a unit whose module graph never reaches `@/ui`
  (see `cells/cellFormatting.test.tsx`) cannot break when the library changes.
