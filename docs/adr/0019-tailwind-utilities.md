# ADR 0019 — Tailwind CSS v4 (utilities layer) alongside CSS modules

- **Status:** Accepted
- **Date:** 2026-07-15

## Context

The `@/ui` layer was styled exclusively with CSS modules as temporary stubs.
[ADR 0013](0013-iwa-components-primereact.md) anticipated that the target
library, **IWA Components (PrimeReact)**, lives in a repository with Tailwind,
and that "if IWA requires Tailwind, we enable Tailwind". The new primitives
(`Icon` + `useCustomIcon`) are styled utility-first, which forced the decision:
how to introduce Tailwind without breaking the existing global styles and tokens.

## Decision

We enable **Tailwind CSS v4** via the `@tailwindcss/vite` plugin, but in a
trimmed-down mode:

- In `src/styles/global.css` we import **only the `theme` and
  `utilities` layers** (`@import 'tailwindcss/theme.css' / 'utilities.css'`).
  **Preflight (the base reset) is deliberately omitted** — the hand-written
  global styles remain the only base layer, so existing components
  look identical.
- **Design tokens stay in CSS custom properties** (`--border`,
  `--surface`, `--accent`, …). From utilities we reference them via
  arbitrary values: `bg-[var(--surface)]`, `border-[var(--border)]`.
- CSS modules and Tailwind **coexist** in `src/ui`: existing stubs
  stay on CSS modules, new primitives can be Tailwind-only. Feature
  code still writes no CSS of its own.

## Consequences

- Zero visual changes to the existing UI (no preflight).
- New primitives (e.g. `Icon`) add no CSS files — easier to swap them
  for IWA components.
- The integration path with IWA/PrimeReact (Tailwind in their repo) stays open;
  if needed we will add `tailwind-merge` to `cx()`.
- Tailwind classes become part of the primitives' visual contract — tests
  can assert on key classes (e.g. `rounded-full`).

## Alternatives considered

- **Full Tailwind with preflight.** The reset would override the hand-written global styles
  and change the look of existing components; unnecessary risk.
- **Sticking with CSS modules only.** Drifts away from the IWA ecosystem (Tailwind) and more
  boilerplate for simple primitives.
- **Tokens in Tailwind's `@theme`.** Moving the tokens into Tailwind syntax
  would tie them to the vendor; CSS variables are neutral and already in use.
