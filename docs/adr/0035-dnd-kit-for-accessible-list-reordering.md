# ADR 0035 — @dnd-kit for accessible list reordering

- **Status:** Accepted
- **Date:** 2026-09-11
- **Refines:** [ADR 0013](0013-iwa-components-primereact.md)

## Context

The table column settings dialog ([ADR 0034](0034-user-table-preferences-in-a-persisted-redux-slice.md))
lets a user put the columns of a generic table in order by dragging rows.
Each row is a composite control — a drag handle, an IWA `Select` and a remove
button — and the reorder must be operable without a pointer: every control in
`@/ui` needs a role and an accessible name, and moving a row from the keyboard
has to be announced in the active language.

Neither IWA Components nor the PrimeReact layer beneath it offers a reorder
primitive that meets this. The IWA stub exposes no drag, handle or reorder
component at all. PrimeReact ships two: `OrderList` reorders through
selection plus side buttons, gives its rows `role="option"` and a click that
toggles selection, and has no live region — a `<select>` inside such a row is
invalid ARIA; `DataTable`'s `reorderableRows` is pointer-only, computes the
drop index from element offsets, and brings table chrome into a modal. The
browser's own HTML5 drag-and-drop has no keyboard path, no announcements,
and is unavailable in jsdom, where the test suite runs.

The dependency budget matters: the seam exists so the app depends on one UI
library, and a reorder library is a new dependency category.

## Decision

We add **`@dnd-kit`** (`@dnd-kit/core`, `@dnd-kit/sortable`,
`@dnd-kit/utilities`) as the one list-reordering mechanism behind `@/ui`.

- The sortable row owns its markup: an `<li>` with a handle `<button>` as the
  only activator (`setActivatorNodeRef`), so the `Select` and the remove
  button keep their native behaviour.
- Two sensors: `PointerSensor` with a 4 px activation distance, so a click
  on the handle is not a drag, and `KeyboardSensor` with
  `sortableKeyboardCoordinates` — Space picks a row up, the arrow keys move
  it, Space drops it, Escape cancels.
- Announcements and the screen-reader instructions come from the i18n
  catalog through `DndContext`'s `accessibility` prop; the library's English
  defaults are never shown.
- The reorder itself is a pure draft reducer action (`rowMoved`); `@dnd-kit`
  only translates gestures into `from`/`to` indices in `onDragEnd`. The
  reducer, the draft selectors and the row keys know nothing about the
  library, and tests drive the reorder through the reducer and the
  `onDragEnd` handler rather than through pointer geometry, which jsdom does
  not have.

## Consequences

- Pointer, touch and keyboard reordering with localized announcements, for
  about 12 kB gzipped, loaded with the customers page chunk rather than the
  entry chunk.
- The dependency stays inside `src/ui/GenericDataTable/settings`; feature
  code imports `TableColumnSettingsDialog` from `@/ui` and never sees
  `@dnd-kit`.
- The work repo must have `@dnd-kit` on its registry; the draft reducer is
  the fallback seam if it does not — a buttons-only row would dispatch the
  same `rowMoved` action.
- Drag geometry is untested in jsdom by design; a manual drive in the browser
  is part of the definition of done for any change to the sortable row.
- `@dnd-kit/core` 6.x is the maintained line; its successor
  (`@dnd-kit/react`) is pre-1.0 and was not adopted.

## Alternatives considered

- **PrimeReact `OrderList`.** Rejected: reorders by selection and side
  buttons, no live region, rows are `role="option"` whose click toggles
  selection — a `Select` inside a row would be both invalid ARIA and
  unusable, and the Lara skin does not match IWA.
- **PrimeReact `DataTable` with `reorderableRows`.** Rejected: pointer-only,
  no announcements, drop index derived from element offsets (all zero in
  jsdom), and a full table inside a modal for a three-control row.
- **Hand-rolled HTML5 drag-and-drop.** Rejected: no keyboard path or
  announcements unless written from scratch, `DragEvent`/`DataTransfer` are
  absent from jsdom and `user-event` has no drag API, so the repository's
  first `fireEvent`-driven tests would assert a fiction.
- **Move up / move down buttons only.** Rejected as the sole mechanism: it is
  keyboard-operable and trivially testable, but the story asks for
  drag-and-drop and two extra buttons per row crowd a 25-row list. It remains
  the fallback if `@dnd-kit` is unavailable, since the reducer is the same.
