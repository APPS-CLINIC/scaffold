# ADR 0045 — Filter lists loaded a page at a time

- **Status:** Accepted
- **Date:** 2026-10-29
- **Refines:** [ADR 0040](0040-filter-options-from-the-service.md)

## Context

The service now serves the lists behind the customer filters a page at a time:
`GET /api/v1/users`, `/teams`, `/internalGroups` and `/corporateGroups` take
`page` (from 0) and `size`, keep the `name` search (contains,
case-insensitive), and answer
`{ content: [{ id, name }], page: { size, number, totalElements, totalPages } }`.
There is still no lookup by id.

Story 14826303 asks for at least five options in every such multiselect, more
loaded as the open list scrolls down, and the picked entries at the top.

## Decision

- **One paged endpoint.** `getFilterListPages`, an RTK Query `infiniteQuery`,
  serves every list by `{ list, name }`: 20 entries a page, the next page while
  `number + 1 < totalPages`, cached for an hour like the other dictionaries.
  It replaces the whole-list and search-only endpoints of ADR 0040. The static
  dictionaries stay as ADR 0040 has them.
- **One control for every paged list.** Advisors and lending teams move from
  `CustomerDictionaryFilter` to `CustomerSearchFilter`, the control the groups
  already used. The open list shows the first page without typing; the typed
  text is searched on the service as before (three characters, 300 ms).
- **Scrolling loads more.** The options hook may return `loadMore`, present
  while the list has more and nothing is on its way. `MultiSelectFilter` calls
  it when the open list is scrolled to within 80 px of its end, through the
  PrimeReact pass-through `pt.wrapper.onScroll` on the part of the list that
  scrolls. The list draws every loaded row; it is not virtualised.
- **Picked entries first.** The options are the "no value" choice, then the
  picked entries, then the loaded pages without them. A picked entry takes its
  name from any cached page of its list, searched or not, else its id shows.
- **Chips load little.** `FilterOptionSearch.load` is `false` for the chip. The
  chip of a paged list loads the first page only while one of its picked
  entries has no name in the cache.

## Consequences

- The list behind a filter may grow without making the first open heavier:
  one request of 20 entries per list the dialog shows.
- Advisors and lending teams are no longer searched in the browser: a search
  of one or two characters only narrows the rows already loaded, as for groups.
- A picked entry past the first page shows its id in the chip after a reload,
  until the user loads the page that lists it. A lookup by id on the service
  would fix it in the feature hook alone.
- The work repo must confirm that the IWA `MultiSelect` passes `pt` on to
  PrimeReact; if it sets its own `pt`, ours must merge with it.

## Alternatives considered

- **PrimeReact's virtual scroller** (`virtualScrollerOptions` with
  `onScrollIndexChange` or `onLazyLoad`). Rejected: it needs the exact row
  height, which the IWA styles set and we cannot read, and it draws no rows in
  jsdom. Twenty rows a page do not need virtualising.
- **IWA `sortSelected` for picked-first.** Rejected: it sorts only the loaded
  rows, so a picked entry from a later page would be missing, and the test
  double does not implement it.
- **Keep loading advisors and teams whole.** Not possible: the endpoints answer
  one page at a time.
