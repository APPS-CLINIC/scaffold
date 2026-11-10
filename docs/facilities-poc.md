# Facilities lazy preview — story 15006016

Open **/dev/facilities** during development. This page simulates a service using
one flat synthetic catalogue. It sends no real Facilities HTTP requests and is
excluded from production. The customer Limits route is unchanged.

The DTOs below are the frontend proposal for backend discussion. They are not
an agreed backend contract. The same DTO format is used by the simulation,
the development table's data source and the downloadable JSON.

## Transport and loaded view model

FacilityNodeDto contains:

- key: stable occurrence key, independently of the facility's id/number;
- parentKey: null for a root, otherwise its parent occurrence key;
- businessLevel: domain level 1–6; a root can start at level 3;
- hasChildren: whether the current query has direct children;
- childrenCount: the number of direct children, independent of fetched pages;
- data: FacilityRow (identity, status, group/type, dates, supplied currency
  variants and indicator information).

A node DTO never embeds children or client loading state. A sibling response
has parentKey, nodes, total and nextCursor. Cursors belong to one parent/query.
The development provider uses small offset strings to simulate them; their
production representation remains a backend decision.

FacilityRootsResponse adds asOf, independent group summaries and query-wide
view metadata: matchingCount, contextKeys, autoExpandedKeys, groupCounts and
facilityTypes. This lets search inspect descendants which the client has not
loaded and keeps counts/dictionaries independent of the loaded subset.

The FE projection FacilityNode adds children, childrenState
(unloaded/loading/loaded/error) and nextCursor. A loaded page can still have
more children. An empty children array with hasChildren=true remains expandable.
TreeDataTable accepts a separate getHasChildren accessor and onExpand intent.

Amounts remain integer minor units with original/PLN/EUR variants supplied by
the data source. The view does not calculate an exchange rate. Summaries are
independent supplied group totals, never a sum of parents and descendants.

## What the development page demonstrates

- Initially fetch a bounded root page. Root DTOs report children without
  preloading descendant rows.
- Expand one node to fetch its immediate children. Deeper branches stay
  unloaded. Leaf nodes have no expansion control.
- Cache loaded pages in the existing baseApi RTK Query cache. Collapsing and
  reopening reuses them. Query changes use separate cache entries; display
  currency changes preserve the service request and expanded branches.
- Continue a sibling page with Load more children, or continue a root page
  with Load more facilities. Child pages deliberately contain one record in
  this small example to exercise the multi-child parent. Root pages allow 50.
- Display branch loading and retry controls without making loaded rows vanish.
- Simulate each root/sibling response asynchronously with a deterministic 500 ms
  delay. The table receives no children until that response completes. RTK
  Query's abort signal cancels the pending timer before evaluating the page.
- Expand all fetches remaining root and child pages sequentially, then expands
  the complete result. Cancel expanding aborts the current request and stops
  subsequent loads. It restores the prior branch state without showing a
  request-failure message; received pages stay cached. Query changes or leaving
  the page also abort the pending expand-all request.
- Evaluate search/filters on the complete simulated service-side catalogue,
  preserve ancestor context and reveal paths for deep matches. A broad match
  may still require sibling continuation. The group summary and counts are
  explicitly independent of detailed filters/search, following the PoC choice.
- Reuse GenericDataTable field configuration, TableCell, shared date/text/link/
  status cells, TableToolbar, TableFilters, SelectFilter and TableActions.
- Keep seven indicator slots; use the IWA Popover adapter for hover/focus and
  keyboard information. The related-data dialog and facility form are examples.

## Downloaded JSON

Download example data produces **facilities-roots-response.json**. It is the
initial root response for the current query, with hasChildren and childrenCount
on every node. It remains a root-only transport response after expanding rows;
no loaded children, loading flags, callbacks or React components are exported.

The original response is retained independently from the loaded cache
projection. Tests capture the actual downloaded Blob and parse its JSON to
verify this boundary, including after expanding the entire tree.

The source catalogue is flat too. The complete forest used to evaluate the
simulated service query is a derived service-side model, not another transport
fixture or something sent to the table on entry.

The asynchronous boundary is in `src/dev/facilities/facilitiesPreview.transport.ts`;
the pure service functions remain separate. See
[ADR 0049](adr/0049-asynchronous-facilities-preview-transport.md).

## Remaining backend/product decisions

1. Agree actual endpoint methods, paths, DTO mapping and cursor semantics.
2. Confirm query-wide ancestry, sibling order, stable occurrence keys and
   behavior when a customer does not own higher business levels.
3. Confirm root/child page sizes and maximum volume. The tiny development
   catalogue is not a memory/throughput benchmark or a virtualization solution.
4. Confirm whether the level filter means business levels 1 through N, and
   whether group counts and summaries react to detailed filters.
5. Supply indicator destinations/availability, dictionaries, FX values and
   timestamps, real forms and XLSX export.

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

The lazy transport proposal is defined by
[ADR 0048](adr/0048-lazy-facilities-preview-data-contract.md).
