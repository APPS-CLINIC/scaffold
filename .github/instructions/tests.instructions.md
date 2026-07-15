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
