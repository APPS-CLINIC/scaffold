# `src/ui` — UI seam

This folder is a **placeholder layer**, not a design system. BIKS is scaffolded
to use the organization's UI library — **IWA UI Components** (PrimeReact) — which
is not integrated here yet (see
[ADR 0013](../../docs/adr/0013-iwa-components-primereact.md)).

## How to plug in IWA UI Components

1. Replace the implementations of `Button`, `TextInput`, `Select`, etc. with
   re-exports (or thin wrappers) of the IWA components.
2. **Keep the exported names and prop contracts** from `index.ts`. Everything
   in `src/features/**` and `src/routes/**` imports from `@/ui`, so as long as
   the contracts hold, no feature code changes.
3. Delete `ui.module.css` once IWA brings its own styling.
4. Where IWA lacks a component or needs a fix/extension, **contribute it
   upstream** to IWA rather than forking it locally.

Example wrapper:

```tsx
// src/ui/Button.tsx
import { Button as IwaButton } from '@iwa/ui';
export const Button = IwaButton;
export type { ButtonProps } from '@iwa/ui';
```

Keeping every UI import funneled through `@/ui` means the rest of the codebase
never depends on a specific vendor — the library is swapped in one folder.
