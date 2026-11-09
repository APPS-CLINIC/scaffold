# Facilities hierarchy PoC — story 15006016

Run the development app and open **/dev/facilities**. The page uses synthetic
data and sends no customer or Facilities requests. The route, preview page and
fixture are removed from production builds. The existing customer Limits
placeholder is intentionally not presented as a working backend integration.

The meeting established that the backend data model and endpoint contract are
not available yet. The PoC is the frontend proposal for review.

## Component and data boundaries

- **src/ui/TreeDataTable:** thin, presentational PrimeReact TreeTable adapter.
  Only the first column indents. All descendants remain rows in one grid.
  Accessors adapt the caller's shape without exposing vendor nodes or events.
  It consumes the same config.fields and TableCell renderer as GenericDataTable.
- **src/features/facilities:** proposed FE model, full-tree filtering,
  Facilities cells, summaries, filter definitions and icon information.
- **src/dev/facilities:** the complete example forest and its page, including
  route-based example facility details, related-data dialogs and JSON download.

facilityTable.config.tsx declares columns and their filters once, with shared
DateCell/TextCell and the composite basic cell built from shared link/status/text
cells. Column filters derive from those fields. Supplementary controls cover
the composite basic cell and view options such as currency and level cap.
The presentation projection keeps the source rows and chosen currency amounts;
it never changes the downloaded model. Both tables compose TableToolbar,
TableFilters, GenericSearch and TableActions. The single-choice SelectFilter
also lives in the shared UI seam.

The model is FacilityNode { key, businessLevel, data, children }. FacilityRow
contains an id, number, status, group, type, description, commitment, contract
currency, expiry/LOO dates, presentation amounts and indicator data. Neither
the fixture nor the downloaded JSON contains React components or callbacks.

Use a stable occurrence key. Do not key rows by their index or assume that a
facility number is unique across every position in a future response.
businessLevel is a domain value from 1 to 6. The structural depth is derived
from children; the second example root starts at business level 3 without
placeholder parents.

Every row supplies original/PLN/EUR FacilityAmounts. Amounts use integer minor
units; utilization is a supplied fractional value, where 0.2 means 20 percent.
The example variants are precomputed inputs, not an agreed FX service.
Missing dates and an unavailable utilization display a dash.

## Demonstrated behavior

- Expand or collapse individual branches; collapsing preserves the remembered
  descendant state. Expand all visits every branch, not just the visible rows;
  leaves do not count as expandable.
- Search a hidden level-six descendant. Nonmatching ancestors remain only as
  context, and the path opens automatically. Parent matches do not implicitly
  include unrelated nonmatching descendants.
- Choose any combination of quick groups. All clears the group restriction.
  Lending includes TFS, as named in the mock-up; selecting both keeps a union
  without duplicating nodes or group totals.
  Counts describe the complete supplied forest and ignore the detailed filters.
- Edit contract currency, type, display currency, maximum business level, C/U,
  expiry range and LOO range in the shared TableFilters dialog. Cancel discards
  the draft. Single-choice fields remain single even in a hand-edited URL.
  Invalid values and reversed date ranges have total parsing defaults.
- Use Back/Forward or a deep link to restore the query. Updating owned filters
  preserves unrelated params. The presentation does not use page/pageSize.
- Changing only display currency preserves expanded branches. The selected
  group's summary stays independent of search and detailed row filters and is
  labelled accordingly. It uses supplied totals once, regardless of the
  number of descendants.
- Read information for every icon on hover or keyboard focus, including grey
  slots. Click pins an interactive panel; ArrowDown enters its action and
  Escape closes it and returns focus. Currency lists wrap. The panel uses the
  existing IWA Popover through a small interaction adapter, following ADR 0013;
  its positioning and appearance remain owned by IWA. The related-data dialog
  is an example action.
- Follow a facility-number link to its example detail dialog. The route and
  current query are preserved, so a real form destination can later replace
  the injected getFacilityHref function.
- Download the proposed full example model as JSON for backend discussion.
  This is separate from the mock-up's future server-generated XLSX export.

## Contract questions for backend and product

1. Can the service return a complete customer forest in one response, with
   stable keys, explicit relations and deterministic sibling order? If it
   returns parentId rows instead, map them in the feature adapter.
2. Which nodes are roots when higher business levels are outside the
   customer's scope? Is the same facility present in multiple positions?
3. Does the Facility dropdown indeed mean business levels 1 through N?
4. Should matched parents include all descendants, and should summaries and
   group counts react to detailed filters/search? The PoC choices above
   are provisional.
5. Which fields and endpoints supply indicator availability, counters, labels,
   action destinations, FX variants, rates and the data timestamp?
6. Which independent limits may be combined? Do not derive group totals by
   summing the displayed hierarchy.
7. What is the largest complete/expanded forest? Measure it before selecting
   an on-demand or virtualized strategy. Removing pagination does not by itself
   establish a safe upper bound.

## Validation boundary

This workspace has no access to the private IWA components, corporate icons
or error-handling package. Vitest uses the existing IWA double plus a decorative
icon double, while TreeDataTable exercises the real public PrimeReact
implementation. InfoPopover uses IWA Popover; its controlled props were checked
against the supplied Storybook screenshots on 2026-11-09. Its test double only
renders the supplied trigger and conditional content. It does not reproduce
IWA positioning, portalling or outside-click dismissal.

Run lint and tests with the public lockfile dependencies available. Full
typecheck, production build, the production-artifact exclusion check, and
visual verification against the actual IWA package remain corporate-environment
checks. Do not interpret a passing double as passing those gates, and do not
add fake runtime package types to hide missing dependencies.
Verify IWA Popover's focus/ref behavior, dismissal, viewport-edge placement and
clipping in the horizontally scrolling table with the actual package.

Use the Node 22 version pinned in .nvmrc. When checking under Node 26, run
NODE_OPTIONS=--no-experimental-webstorage npm test so Node's experimental
localStorage does not shadow jsdom's browser storage.

The tests cover six-level expansion, non-first business roots, leaf behavior,
strict filtering and context, date bounds, URL navigation and filter drafts,
summary double-count prevention, precomputed currency variants, inactive icon
information, and interactive panel keyboard/focus behavior.

See [ADR 0046](adr/0046-facilities-hierarchy-as-a-development-poc.md).
The shared UI contract is refined by
[ADR 0047](adr/0047-shared-table-fields-cells-and-toolbar.md).
