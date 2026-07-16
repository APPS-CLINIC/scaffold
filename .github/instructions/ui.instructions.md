---
description: 'Rules for the @/ui seam — placeholder primitives for the org UI library'
applyTo: 'src/ui/**'
---

# `src/ui` — the UI seam

- This folder is a seam for the organization's UI library (target: IWA
  Components / PrimeReact, see `docs/adr/0013`). Exported names and prop
  contracts from `src/ui/index.ts` are the public API — do not rename or
  change them without an explicit request; the rest of the app depends on
  them.
- Every new primitive must be exported (with its prop types) from
  `src/ui/index.ts`. Feature/route code imports only from `@/ui`.
- Style new primitives with Tailwind v4 utilities (see `docs/adr/0019`):
  no new CSS/CSS-module files. Colors come from the design tokens in
  `src/styles/global.css`, referenced as arbitrary values —
  `bg-[var(--surface)]`, `border-[var(--border)]`, `text-[var(--muted)]`.
- Do not import Tailwind preflight or add global styles from this folder;
  `src/styles/global.css` is the only base layer.
- Join class names with `cx()` from `./cx` and always merge a caller-provided
  `className` last so callers can override styling.
- Follow the established component shape: `forwardRef`, props interface
  extending the matching `HTMLAttributes`, sensible defaults, JSDoc on the
  export explaining the contract.
- Accessibility is part of the contract: decorative elements are hidden from
  assistive tech (`aria-hidden`), meaningful ones get a proper role and
  accessible name (see `useCustomIcon`'s `label` prop for the pattern).
- Every primitive ships a co-located `*.test.tsx` covering rendering, a11y
  semantics, and prop contract (variants, className merging, overrides).
