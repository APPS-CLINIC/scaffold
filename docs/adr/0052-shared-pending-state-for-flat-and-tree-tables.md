# ADR 0052 — Shared pending state for flat and tree tables

- **Status:** Accepted
- **Date:** 2026-11-10
- **Refines:** ADR 0043, ADR 0047 and ADR 0049

## Context

GenericDataTable retains its configured headers and renders placeholder cells
while its owner loads data. Facilities previously replaced the whole view with
a loading paragraph; TreeDataTable also had no placeholder rows. This made
pending behavior and focus retention differ between the two table views.

## Decision

- Extract GenericDataTable's existing one-line shimmer into TableCellSkeleton.
  Flat and tree bodies use that same renderer, styling and decorative semantics.
- Keep the tree grid and configured headers mounted during a root request.
  Replace real rows with ten placeholder rows and suppress expansion controls,
  cell callbacks and the empty-result message while pending.
- Use the existing ListToolbarSkeleton before the first Facilities response.
  Preserve the real toolbar during later requests. Reuse useLoadingPhase's
  300 ms delay and 500 ms minimum display time for the owner-controlled load.
- Keep loaded siblings visible when fetching more roots or direct children.
  Append a decorative placeholder at the pending location. Child loading uses
  a supplied accessor; root continuation uses loadingMore. Loaded row data and
  hasChildren metadata are not replaced by synthetic transport records.
- Keep the placeholder discriminant inside the PrimeReact adapter. Public
  callbacks receive real feature rows only; DTOs and JSON exports stay data-only.

## Consequences

Both table implementations use the same cell placeholder. Facilities no longer
unmounts its grid/search/filter controls on a query change, and a pending branch
does not replace the rest of the hierarchy. Screen readers receive loading
status; placeholder cells remain decorative and expose no actions.

Tests verify grid identity, configured headers, timing, the toolbar remaining
available, and loaded siblings surviving child/root continuation. No backend
contract or private-design-system dependency is changed.

## Alternatives considered

- Use another stand-alone skeleton table: separates placeholder columns from
  the actual configuration and replaces the grid.
- Duplicate GenericDataTable's shimmer markup: lets the table styles drift.
- Hide the complete tree for every child request: disrupts unrelated branches.
