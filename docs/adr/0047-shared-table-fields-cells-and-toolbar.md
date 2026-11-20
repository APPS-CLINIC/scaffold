# ADR 0047 — Shared table fields, cells and toolbar

- **Status:** Accepted
- **Date:** 2026-11-06
- **Refines:** ADR 0025, ADR 0039 and the UI contract of ADR 0046

## Context

The Facilities PoC introduced a second column contract with render callbacks,
inline date/status/link markup and its own toolbar layout. Although hierarchy
expansion differs from responsive row details, field rendering and list controls
have the same responsibilities. Duplicating them would let formatting, filters,
keyboard behavior and styling drift between customer and Facilities tables.

## Decision

- Reuse GenericDataTableFieldConfig and GenericDataTableCellProps for both
  table implementations. TreeDataTable receives config.fields using the existing
  labelKey, width, component, filter and class contracts. Its separate key and
  children accessors still describe the hierarchy; pagination, sorting and
  responsive-detail policy remain specific to GenericDataTable.
- Render flat columns, responsive details and tree columns through one TableCell.
  It selects the configured component or the same safe primitive fallback.
  Keep existing exported type names compatible rather than renaming the public
  UI seam across the scaffold.
- Facilities adapts its data-only node model to presentation rows in the feature.
  The projection chooses a supplied currency variant, preserves occurrence keys,
  business levels and source rows, and marks ancestor context. No renderer or
  callback is added to the transport proposal or JSON download.
- Use shared TextCell, DateCell, ActiveArchivalStatusCell and UnderlinedTextCell.
  Only the composite Facilities basic cell and its domain amount/percentage
  rendering remain feature-specific. UnderlinedTextCell accepts an optional to
  destination for client-side links; existing href/IWA link behavior stays valid.
- Put Facilities columns and their date filters in one feature configuration.
  Derive column filters from those fields. Composite-cell and view-only filters
  are explicit supplementary controls in the same configuration module; do not
  manufacture columns for display currency or a business-level cap.
- Share TableToolbar as a filter/search/action slot layout and TableActions as
  controlled actions. Neither reads URL state or chooses the expansion policy.
  The owner supplies expandable keys: current flat records, or every branch
  recursively for the tree. GenericTableSettings remains a compatible adapter
  from its existing row-based props to TableActions.
- Move the domain-neutral single-choice control to SelectFilter in @/ui,
  alongside the existing filter controls and summary contract.

## Consequences

Both views share formatting, typed cell dispatch, toolbar structure and action
behavior. The customer list retains its pagination, responsive details, column
settings, export and URL policies. Tree expansion still visits hidden branches
and excludes leaves. New UI primitives have component tests, and existing view
tests exercise the composed controls.

The private IWA dependency boundary is unchanged. Local tests exercise doubles
and real public PrimeReact; actual IWA typecheck, build and visual verification
still require the corporate environment.

## Alternatives considered

- Keep separate render callbacks and toolbar markup: duplicates the same UI
  contracts without a hierarchy-specific benefit.
- Add hierarchy behavior to GenericDataTable: couples responsive field details
  to a different expansion model and mandatory pagination.
- Introduce a new table framework or rename every existing table type: adds
  migration work without a new data or presentation requirement.
