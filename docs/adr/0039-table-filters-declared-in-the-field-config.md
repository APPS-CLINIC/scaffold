# ADR 0039 — Table filters declared in the field config

- **Status:** Accepted
- **Date:** 2026-10-05
- **Refines:** [ADR 0025](0025-configuration-driven-generic-data-tables.md),
  [ADR 0034](0034-user-table-preferences-in-a-persisted-redux-slice.md)

## Context

The customer list gets a "Customize filters" dialog with a filter for most of
its fields: multiselects over enum values and over lists from the service,
date ranges with open ends, and a free-text filter. The filters must appear in
the order the table shows its fields, and a field the user removed in the list
settings (ADR 0034) must lose its filter: no row in the dialog and no effect on
the request. Applied filters show as removable chips with a "Clear filters (n)"
link.

[ADR 0025](0025-configuration-driven-generic-data-tables.md) already describes
every field once — label, width, cell component, sortability — and the list
settings decide which of those fields the table uses and in what order.
Keeping a second, separate filter list would duplicate that order and could
drift from it.

## Decision

- A field config may declare its filter next to its cell component:
  `filter: tableFilter(MultiSelectFilter, { options })`. The config names the
  control and passes that control's own props; `tableFilter` checks them
  against the control's type.
- `src/ui/TableFilters` holds the domain-neutral pieces, exported from `@/ui`:
  - `TableFilters`: the "Customize filters" button, the clear link, one IWA
    `ChipInput` chip per applied filter and the dialog. It is controlled
    (`fields`, `values`, `onChange`) and knows nothing about the URL.
  - The dialog keeps a draft while open; Save hands over all values at once,
    Cancel and closing discard the draft.
  - Controls: `MultiSelectFilter`, `DateRangeFilter` and `TextFilter`. Every
    control receives the same props (`inputId`, `labelId`, `param`, `values`,
    `onChange`) and works on the URL params it owns: the field's param and any
    `param.<part>` (ADR 0038). A date range writes `<param>.from` and
    `<param>.to`, either of them alone for an open end.
  - A field filters by its name; `filterParam` names the param when the service
    calls it differently, the way `sortField` does for sorting.
  - `createMultiSelectFilter(useOptions)` builds a multiselect whose options a
    hook supplies, for lists the service serves. `@/ui` never fetches: the
    owning feature writes the hook.
  - Every control also has a `useSummary` hook that puts a value into words
    for its chip. It is a hook so a control can read translations or loaded
    option lists. `tableFilter` builds the field's chip component around it,
    so no hook is passed around as a value.
- The owner passes the fields the table uses, from the list settings
  (`useTableColumnSettings(...).config.fields`). Filters therefore follow the
  table's order, and a removed field has no filter row and no chip.
- The owner keeps the values in the URL and decides what reaches its endpoint.
  It derives the request from the URL and the fields in use, so a filter of a
  field the user removed never applies, even from a shared link. It gives
  `TableFilters` the validated values it sends, so a chip is always a filter in
  effect.

## Consequences

- A new filterable field is a `filter` line in the table config and its params
  in the owner's filter schema ([ADR 0026](0026-extensible-feature-filters-in-list-urls.md)).
- A new kind of filter is one component with the shared props and a
  `useSummary` hook; the dialog and the chips do not change.
- A chip uses the IWA `ChipInput` with one chip each, because a chip label is
  text that a filter can only resolve inside its own hook.
- A link that filters a field the recipient has removed keeps the parameter in
  the URL without effect, until the filters or the list settings are saved.

## Alternatives considered

- **A separate filter list per table.** Rejected: it would repeat the field
  order the list settings already own and could fall out of step with it.
- **A closed set of filter kinds (`type: 'multiSelect' | 'dateRange' | …`).**
  Rejected: the dialog would grow a branch per kind, and the config would not
  say which component renders the filter.
- **Chips rendered by the filter controls themselves.** Rejected: the chip row
  would mix vendor chips with custom markup; one `ChipInput` per chip keeps the
  IWA look.
