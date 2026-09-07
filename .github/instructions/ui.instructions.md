---
description: 'Rules for the @/ui seam — local primitives and IWA wrappers'
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
- One exception to importing only from `@/ui`: a module that calls a primitive
  while it is being evaluated, rather than while rendering, imports that
  primitive from its own file. `navigation.manifest.ts` builds its icons at
  module scope, so it imports `@/ui/createPrimeIcon` directly; going through the
  barrel would make it wait for every primitive to initialise, and one import
  cycle then leaves the binding undefined — `(0 , createPrimeIcon) is not a
function`, thrown from the manifest rather than from the cycle.
- A hook that renders or styles UI is a primitive and lives here too
  (`useCustomIcon` is the example), exported from the same barrel. Only
  store-bound hooks belong in `src/app/hooks.ts`. There is no third home for
  hooks: a second copy under another folder is a duplicate, not a variant.
- Style new primitives with Tailwind v3 utilities (see `docs/adr/0021`):
  no new CSS/CSS-module files. Colors come from the design tokens in
  `src/styles/global.css`, referenced as arbitrary values —
  `bg-[var(--surface)]`, `border-[var(--border)]`, `text-[var(--muted)]`.
- Do not add Tailwind directives or global styles from this folder;
  `src/styles/global.css` is the only global base layer.
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
