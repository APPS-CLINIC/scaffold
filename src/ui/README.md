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

## `DataPanel` and `DataPanelSkeleton`

`DataPanel<T>` renders a stable icon + two-data-column panel from a typed
`fields` config rather than hardcoded rows. Each field declares `id`,
`labelKey`, `column`, and a `value` reader; `formatValue` transforms data before
the default renderer, while `renderValue` composes richer values such as an IWA
`Label`. Rows use IWA `DefinitionList`, and empty raw, formatted, or rendered
values fall back to `emptyValue` without removing the configured row.

Keep the complete field list present for every data variant and pass that same
config to `DataPanelSkeleton`, together with the column labels and icon/header
flags. Use `iconSize="hero"` when the loaded panel uses the large hero icon;
the default reserves the regular icon size. The skeleton keeps translated
labels invisibly in flow, so it reserves their exact responsive wrapping.
Loaded values use a fixed, truncated row with their complete text available
through the native title and accessibility tree; `valueSize` keeps richer
values such as an IWA `Label` on the same height in both states. Both
components share the same layout primitives and IWA definition-list geometry,
so loading does not cause a layout shift even for long backend values.

## `ScreenHeading`

`ScreenHeading` is the app-facing adapter over IWA's page heading. Items use a
single `{ label, navigateTo }` contract. The seam supplies the older `url`
alias only for the local compatibility package, so route and feature code do
not depend on two IWA versions. Use it for the standard **Back to:** line and
orange page H1 instead of recreating that structure locally.

## `PrimeIcon` and `createPrimeIcon`

`PrimeIcon` is the typed adapter for the PrimeIcons font already included by
the IWA stack. It is decorative by default and becomes an accessible image when
given `aria-label`. `createPrimeIcon(name)` returns a stable component reference
for configuration-driven navigation; store that component in config instead of
serializing or recreating React icon nodes.

## `useCustomIcon`

`useCustomIcon(icon, options?)` binds any icon element (inline SVG, font
glyph, emoji) into a ready-to-use component with **default circular styling
built in**: a `rounded-full` badge (Tailwind-only) with the glyph centered
inside. SVGs and PrimeIcons scale automatically with the selected circle size
and inherit `currentColor`; callers should not add a separate glyph-size class.

```tsx
import { useCustomIcon } from '@/ui';

function HistoryButton() {
  const HistoryIcon = useCustomIcon(historyGlyph, {
    size: '2xl',
    tone: 'brand',
    label: 'History',
  });

  return <HistoryIcon />;
}
```

- `size`: `sm | md | lg | xl | 2xl` (default `md`); `tone`: `outline |
neutral | accent | brand` (default `outline` — light surface with a subtle
  ring, colors come from the global CSS variables). `brand` uses the ING-orange
  navigation token with a white glyph.
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

For nested navigation, use the re-exported IWA `NavigationMenuItem` and pass
leaf children through its native `subNodes: NavigationMenuSubNode[]` contract.
The installed component exposes only one child level, so deeper configured
branches recurse through the application adapter while continuing to use IWA
for each rendered item. Keep route matching, active-ancestor calculation, and
branch expansion in the resolver; compose a separate semantic expand/collapse
button only because the installed IWA item does not provide one.
