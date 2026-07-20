# `src/ui` — UI seam

This folder is the stable application-facing **UI seam**, not a design system.
The repository includes the IWA Components / PrimeReact dependency stack, while
local primitives stay here until they are replaced with thin IWA wrappers.

## How to evolve the seam

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

## `useCustomIcon`

`useCustomIcon(icon, options?)` binds any icon element (inline SVG, font
glyph, emoji) into a ready-to-use component with **default circular styling
built in**: a `rounded-full` badge (Tailwind-only) with the glyph centered
inside. SVGs auto-scale to ~55% of the circle and inherit `currentColor`.

```tsx
import { useCustomIcon } from '@/ui';

function HistoryButton() {
  const HistoryIcon = useCustomIcon(historyGlyph, { size: 'lg', label: 'History' });

  return <HistoryIcon tone="accent" className="text-orange-600" />;
}
```

- `size`: `sm | md | lg | xl` (default `md`); `tone`: `outline | neutral |
accent` (default `outline` — light surface with a subtle ring, colors come
  from the global CSS variables).
- `label` sets `role="img"` + `aria-label`; without it the icon is
  `aria-hidden` (decorative).
- The hook memoizes on the glyph element and options — keep them
  referentially stable (hoist the element out of render, like `historyGlyph`
  above) so the returned component keeps its identity across re-renders.
