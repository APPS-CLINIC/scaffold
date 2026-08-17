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

## `GenericDataTable`

`GenericDataTable<T>` is the lazy, server-driven table seam. The caller owns
fetching and URL state; the table receives rows plus controlled pagination and
sort values, then reports user intent through `onPageChange` and
`onSortChange`. Its public `page` value is always **1-based**.

The config is **one flat `fields` list** — every field can render as a column.
At runtime the table measures its container and shows, in display order, as
many columns as fit **without horizontal scrolling**; the remaining fields
move to the expanded-row accordion. Each field carries the same config shape:
a single `labelKey` (used for the column header and the accordion label
alike), a pixel `width` the fit engine budgets with, an optional cell
`component`, and `sortable`. `alwaysVisible: true` pins a field so it can
never drop; `columnOrder` overrides the display (and therefore drop) order.
When the currently sorted column drops into the accordion the table calls
`onSortClear`, so the owner can reset the sort in its store/URL.

Reusable, domain-neutral cell components live with the table seam, one public
cell per file. Features compose `TextCell`, `UnderlinedTextCell`, `DateCell`,
`ActiveArchivalStatusCell`, or `ValidityStatusCell`; a feature-specific
renderer is only needed when those building blocks cannot express the domain
value.

```tsx
import { ActiveArchivalStatusCell, UnderlinedTextCell } from '@/ui';
import type { GenericDataTableConfig } from '@/ui';

interface Customer {
  id: number;
  name: string;
  status: 'ACTIVE' | 'ARCHIVAL';
  internalNote: string | null;
  secretToken: string;
}

export const customerTableConfig = {
  dataKey: 'id',
  fields: [
    {
      field: 'name',
      labelKey: 'customers.table.field.fullName',
      component: UnderlinedTextCell,
      sortable: true,
      width: 192,
      alwaysVisible: true,
    },
    {
      field: 'status',
      labelKey: 'customers.table.field.status',
      component: ActiveArchivalStatusCell,
      width: 112,
    },
    {
      field: 'internalNote',
      labelKey: 'customers.table.field.kkf',
      width: 128,
    },
  ],
} as const satisfies GenericDataTableConfig<Customer>;
```

`fields` is an explicit allowlist: `secretToken` is never rendered just
because it exists in backend JSON. Primitive and null values have a safe
default renderer; configured object values require their own typed component.
Expansion is local interaction state and behaves as a single-row accordion by
default (`singleRowExpansion: false` opts into multiple expanded rows). A
feature can control it with `expandedRowKeys` and
`onExpandedRowKeysChange`, for example to provide an external "expand all"
control without moving presentation state into Redux or the URL. The
expansion toggle column renders only while at least one field is in the
accordion. In jsdom tests use `mockTableContainerWidth` from
`@/test/tableLayout` to give the fit engine a concrete width.

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

## IWA navigation adapters

`MenuListAdapter` and `NavigationPanel` are thin adapters over the corresponding
IWA components. `MenuListAdapter` deliberately exposes stable item IDs instead
of IWA's positional selection contract:

```tsx
<MenuListAdapter
  items={[
    { id: 'dashboard', text: 'Dashboard' },
    { id: 'clients', text: 'Clients' },
  ]}
  selectedId="dashboard"
  onItemSelect={(item) => navigate(item.id)}
/>
```

Route code maps the selected ID to a configured path. Do not store
`selectedIndex`, and do not serialize React icon nodes into navigation JSON.
