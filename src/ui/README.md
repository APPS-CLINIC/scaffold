# `src/ui` — UI seam

This folder is a **placeholder layer**, not a design system. The app was
scaffolded to use your **internal / organization UI library**, which is
intentionally **not** included here.

## How to plug in your library

1. Replace the implementations of `Button`, `TextInput`, `Select`, etc. with
   re-exports (or thin wrappers) of your org components.
2. **Keep the exported names and prop contracts** from `index.ts`. Everything
   in `src/features/**` and `src/routes/**` imports from `@/ui`, so as long as
   the contracts hold, no feature code changes.
3. Delete `ui.module.css` once your library brings its own styling.

Example wrapper:

```tsx
// src/ui/Button.tsx
import { Button as OrgButton } from '@my-org/ui';
export const Button = OrgButton;
export type { ButtonProps } from '@my-org/ui';
```

Keeping every UI import funneled through `@/ui` means the rest of the codebase
never depends on a specific vendor — you can swap libraries in one folder.

## `Icon` + `useCustomIcon`

`Icon` renders a **circular badge** (`rounded-full`, Tailwind-only) with the
glyph centered inside — pass any icon element (inline SVG, font glyph, emoji)
as children. SVGs auto-scale to ~55% of the circle and inherit `currentColor`.

```tsx
import { Icon, useCustomIcon } from '@/ui';

// One-off usage:
<Icon size="lg" tone="outline" label="Historia zmian" className="text-orange-600">
  <HistorySvg />
</Icon>;

// Bind a glyph + defaults into a reusable component:
const HistoryIcon = useCustomIcon(historyGlyph, { size: 'lg', label: 'Historia' });
// ...
<HistoryIcon />                 // uses the bound defaults
<HistoryIcon tone="accent" />   // per-usage props override them
```

- `size`: `sm | md | lg | xl` (default `md`); `tone`: `outline | neutral |
accent` (default `outline` — light surface with a subtle ring, colors come
  from the global CSS variables).
- `label` sets `role="img"` + `aria-label`; without it the icon is
  `aria-hidden` (decorative).
- `useCustomIcon` memoizes on the glyph element and options — keep them
  referentially stable (hoist the element out of render, like `historyGlyph`
  above) so the returned component keeps its identity across re-renders.
