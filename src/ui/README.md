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
