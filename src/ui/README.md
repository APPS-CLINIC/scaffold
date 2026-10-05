# `src/ui` — UI seam

This folder is the stable application-facing **UI seam**, not a design system.
The repository includes the IWA Components / PrimeReact dependency stack, while
local primitives stay here until they are replaced with thin IWA wrappers.

## How to evolve the seam

1. Components the org library already provides come straight from IWA through
   `index.ts` (`Button`, `TextInput`, `Select`, … — see
   [IWA re-exports](#iwa-re-exports)); local primitives stay only where IWA has
   no equivalent.
2. **Keep the exported names and prop contracts** from `index.ts`. Everything
   in `src/features/**` and `src/routes/**` imports from `@/ui`, so as long as
   the contracts hold, no feature code changes.
3. To swap a library, replace the re-export with a thin wrapper that keeps the
   contract:

```tsx
// src/ui/index.ts
export { Button, type ButtonProps } from '@my-org/ui';
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
never drop; the `fields` order is the display (and therefore drop) order.
When the currently sorted column drops into the accordion the table calls
`onSortClear`, so the owner can reset the sort in its store/URL.

To let users choose which fields are used and in what order, keep the static
config as the base and hand the table a config whose `fields` come from the
pure `resolveColumnFields(fields, columns)`: it maps an ordered list of field
names to the matching field configs, drops unknown and repeated names, falls
back to the configured `fields` when nothing resolves, and returns the input
`fields` reference whenever the result would be identical, so memoized
consumers and the `onSortClear` effect stay quiet. Fields left out of the list
reach neither the columns nor the accordion. An optional `id` names the config
so its settings can be stored per table.

Reusable, domain-neutral cell components live with the table seam, one public
cell per file. Features compose `TextCell`, `UnderlinedTextCell`, `DateCell`,
`OverdueDateCell`, or `ActiveArchivalStatusCell`; a feature-specific renderer is
only needed when those building blocks cannot express the domain value.

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

### Column settings

`TableColumnSettingsDialog<T>` is the "List settings" dialog: one sortable
row per used column (drag handle, column name, remove), "Add column",
"Restore defaults" behind a confirmation, Cancel and Save. A row added with
"Add column" picks its field from an IWA `Select` of the unused fields and
keeps that Select until Save. The dialog is an IWA `CustomizableDialog` with a
fixed 600 × 835 px frame (capped by the viewport) and its own footer, so the
tab line and the footer separator span the whole dialog and only the column
list scrolls; a newly added row is scrolled into view. It is
presentational and generic: `fields` is the universe of `{ field, labelKey }`
options in configuration order, `columns` the field names in use when it
opens, and `onSave` receives the ordered field names once every row is filled
(a blocked Save marks the rows empty at that moment with "Fill in or remove
the column" and scrolls the first one into view; rows added later start
unmarked). Cancel,
the close icon and a backdrop click call `onCancel`; confirming the restore
calls `onRestoreDefaults`. The owner keeps the effective columns, persists
them and closes the dialog. Nothing renders while `open` is false, so every
opening starts from the current `columns`. Reordering runs on `@dnd-kit`:
pointer drag on the handle, or Space, arrow keys and Space from the keyboard,
announced through the i18n catalog. `GenericTableSettings` renders the
"List settings" action first in the toolbar when `onOpenSettings` is given.

```tsx
import { useState } from 'react';
import { useTableColumnSettings } from '@/features/tableSettings';
import { GenericDataTable, GenericTableSettings, TableColumnSettingsDialog } from '@/ui';

function CustomersList() {
  const settings = useTableColumnSettings(customerTableConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <GenericTableSettings {...toolbarProps} onOpenSettings={() => setSettingsOpen(true)} />
      <GenericDataTable config={settings.config} {...tableProps} />
      <TableColumnSettingsDialog
        open={settingsOpen}
        fields={customerTableConfig.fields}
        columns={settings.columns}
        onSave={(columns) => {
          settings.saveColumns(columns);
          setSettingsOpen(false);
        }}
        onCancel={() => setSettingsOpen(false)}
        onRestoreDefaults={() => {
          settings.restoreDefaults();
          setSettingsOpen(false);
        }}
      />
    </>
  );
}
```

## `DueDateFilter` and due-date windows

A domain-neutral filter over calendar dates, shown as multiple-choice IWA `Chips`:
**All · Up to 30 days · Over 30 days · Overdue** (`common.dueDateFilter.*`). The
user can combine windows. The owning view keeps the chosen windows in local
state and filters its own items. See [ADR 0037](../../docs/adr/0037-generic-due-date-filter-in-the-ui-seam.md).

- `dueDateWindow(date, today?)` returns `'overdue'` (before today),
  `'upTo30Days'` (today through today + 30 days), `'over30Days'` or `null` for a
  value that is not a `yyyy-MM-dd` date. It uses `daysPastIsoDate`, so it matches
  the overdue markers.
- A `DueDateSelection` is the list of chosen windows; `ALL_DUE_DATES` (empty)
  means all items.
- `filterByDueDate(items, getDate, windows, today?)` keeps the items whose date
  falls into any chosen window; with none chosen it keeps everything, including
  items without a date. It filters a **fully loaded** collection. A
  server-paginated list sends the windows to its endpoint instead.
- `<DueDateFilter value onChange />` is a `role="group"` with a default name
  ("Due date filter"), which a caller's `aria-label` replaces. "All" is
  exclusive: picking it clears the windows, picking a window drops it, and
  unselecting the last window brings it back. The group announces the chosen
  filters in visually hidden text. `className` is merged last.

```tsx
import { useState } from 'react';
import { ALL_DUE_DATES, DueDateFilter, filterByDueDate, type DueDateSelection } from '@/ui';

const [windows, setWindows] = useState<DueDateSelection>(ALL_DUE_DATES);
const shown = filterByDueDate(rows, (row) => row.dueDate, windows);

<DueDateFilter value={windows} onChange={setWindows} />;
```

## `GenericSearch`

`GenericSearch` is a search field built on IWA `SearchWithAutocomplete`, for
any list or table; it knows nothing about either. It is controlled by the
search applied now: `value` is that search and `onSearch` receives the next one
300 ms after typing pauses. The text is trimmed, and anything shorter than
three characters searches for `''`, the full list. The field keeps what the
user typed, and it takes over `value` when the search changes from outside,
e.g. on Back. The owner decides where the search lives: a server-paged list
keeps it in the URL's `q` (ADR 0006), and `replace` keeps typing out of the
browser history.

```tsx
import { GenericSearch } from '@/ui';

const listQuery = useAppSelector(selectListQuery);
const { setQuery } = useListQueryState();

<GenericSearch
  value={listQuery.q}
  placeholder={t('customers.search.placeholder')}
  onSearch={(q) => setQuery({ q }, { replace: true })}
/>;
```

## `TableFilters`

A table field declares the control that filters it, next to its cell
component: `filter: tableFilter(Component, props)`. `tableFilter` checks the
props against the control's type. A filter works on URL params named like the
service params (ADR 0038): the field's name, or `filterParam` when the service
calls it differently. The built-in controls:

- `MultiSelectFilter` (`options`: `{ value, labelKey }` or `{ value, label }`,
  optional `selectionLimit`): IWA `MultiSelect`, one repeated param; typing in
  the open list keeps the options whose label contains the text.
- `DateRangeFilter`: two IWA `DatePicker`s writing `<param>.from` and
  `<param>.to` as `yyyy-MM-dd`; either end may stay empty. The calendars open
  on `document.body`, so the scrolling dialog rows do not clip them.
- `TextFilter`: IWA `TextInput`, one param; blank text is no filter.
- `createMultiSelectFilter(useOptions, { selectionLimit })`: a multiselect whose
  options come from a hook, such as a list the service serves. The hook gets the
  props the field declares and runs in the control and in its chip alike; the
  owner keeps the hook, and with it the request, in its feature.

Every control receives `TableFilterProps` — `inputId` for the row label,
`labelId` for controls with several inputs, `param`, the `values` of the params
it owns (`param` and any `param.<part>`) and `onChange` with their next values —
plus its own props. A control also has a static `useSummary(values, props)` hook
that puts its values into words for the chip, so a new kind of filter is one
component and one hook. `tableFilter` builds each field's chip component around
that hook, so call it once per field where the config is defined.

`TableFilters` renders "Customize filters", the "Clear filters (n)" link, one
IWA `ChipInput` chip per applied filter and the dialog (824 × 660; the rows
scroll under a fixed heading and footer, without a visible scrollbar; Cancel
and closing discard the draft). It is controlled: `values` are the current
filter values by param and `onChange` receives the next values of the filters
shown. Pass the fields the table uses —
`useTableColumnSettings(config).config.fields` — so the filters follow the
column order and a removed field has no row and no chip, and pass the values
the owner actually applies, so every chip is a filter in effect. The owner
keeps the values (a server-paged list keeps them in the URL, ADR 0038), decides
what happens to the value of a removed field, and uses
`replaceTableFilters(current, fields, next)` to write the params of its fields
while keeping others. See
[ADR 0039](../../docs/adr/0039-table-filters-declared-in-the-field-config.md).

```tsx
import {
  isFilterableField,
  MultiSelectFilter,
  replaceTableFilters,
  tableFilter,
  TableFilters,
} from '@/ui';

// In the table config:
{
  field: 'status',
  labelKey: 'customers.table.field.status',
  filter: tableFilter(MultiSelectFilter, {
    options: [{ value: 'ACTIVE', labelKey: 'common.status.active' }],
  }),
}

// In the view. `appliedFilters` are the validated values the request carries;
// rewriting every filterable field also drops a removed field's value.
const filterableFields = config.fields.filter(isFilterableField);

<TableFilters
  fields={tableSettings.config.fields}
  values={appliedFilters}
  onChange={(next) =>
    setQuery({ filters: replaceTableFilters(listQuery.filters, filterableFields, next) })
  }
/>;
```

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

## IWA re-exports

Components the app consumes from IWA without an adapter are re-exported
verbatim from `index.ts` (`ActionLink`, `Button`, `Card`, `ChipInput`,
`CustomizableDialog`, `DatePicker`, `MultiSelect`, `Select`, `Switch`,
`TabMenu`, `TextInput`, `TopBar`, …); `index.ts` is the complete list. Feature code imports them from
`@/ui` like every local primitive.

### `Select`

`Select` is the IWA dropdown, not a native `<select>`: IWA passes PrimeReact
`Dropdown` props through. `options` is a plain array of strings or
`{ value, label }` objects, and `value` plus `onChange` make it controlled.
`onChange` receives PrimeReact's change event, not the value itself — read
`event.value`, which is the picked option's `value` (or `null` once the
selection is cleared). The library sorts options alphabetically by default, so
pass `sortOptions={false}` whenever the configured order is the contract.
`errorMessage` both marks the field invalid and renders the text. Stick to the
props the library documents — `options`, `value`, `onChange`, `disabled`,
`readOnly`, `errorMessage`, `error`, `showErrorMessage`, `sortOptions`,
`componentSize`, `className`, `dataTestId` — and label the field with
surrounding markup rather than a placeholder.

```tsx
import { Select } from '@/ui';

<Select
  options={fields.map((field) => ({ value: field.name, label: t(field.labelKey) }))}
  value={selected}
  onChange={(event) => setSelected(event.value)}
  sortOptions={false}
  errorMessage={invalid ? t('form.required') : undefined}
/>;
```

### `SearchWithAutocomplete`

`SearchWithAutocomplete` is the IWA search field with the magnifier. IWA passes
PrimeReact `AutoComplete` props through, so `value` plus `onChange` make it
controlled even though its Storybook table lists only IWA's own props.
`onChange` receives PrimeReact's change event: `event.value` is the typed text.
The clear action hands back `valueReturnedOnClear` instead, which is not text
unless you set it, so treat any non-string value as an empty field. Without
`suggestions` it works as a plain search box.

```tsx
import { SearchWithAutocomplete } from '@/ui';

<SearchWithAutocomplete
  placeholder={t('customers.search.placeholder')}
  value={input}
  onChange={(event) => setInput(typeof event.value === 'string' ? event.value : '')}
/>;
```

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
