# ADR 0037 — Generic due-date filter in the UI seam

- **Status:** Accepted
- **Date:** 2026-09-25
- **Refines:** ADR 0006

## Context

The customer review dates need the design's filter chips: All / Up to 30 days /
Over 30 days / Overdue (`common.dueDateFilter.*`). The product owner expects the same filter
in other views, so it cannot live in the customers feature. The rows are
already loaded when the filter changes, so filtering happens in the browser.

[ADR 0033](0033-customer-detail-presentation-feature-local.md) took the
single-consumer generic layers out of `@/ui` and kept customer presentation in
the feature. This ADR is the explicit decision to add a reusable primitive to the
seam: the product owner asked for this filter to be reused in other views, and
[ADR 0025](0025-configuration-driven-generic-data-tables.md) is the precedent for
domain-neutral building blocks in `@/ui`.

[ADR 0006](0006-url-as-single-source-of-truth.md) makes the URL the single source
of truth for view state — search text, filters, sorting and pagination — so it can
be shared and survives a reload. This filter is different: it reaches no endpoint
and only hides a few rows the view already holds, and the product owner wants it
kept simple rather than shareable.

## Decision

- The filter is a domain-neutral primitive in `src/ui/DueDateFilter`, exported
  from `@/ui`:
  - `DueDateFilter` renders the four windows as single-choice chips and is
    controlled through `value` and `onChange`. The group also names the chosen
    filter in visually hidden text.
  - The chip is a local `Chip` in `@/ui` for now: `iwa-react-components` does not
    export its `Chip` correctly. The local one keeps the IWA `ChipProps` names,
    exposes `aria-pressed` and is marked with a TODO to swap back to IWA once
    the export is fixed. The hidden text above keeps the choice announced after
    the swap, since the IWA chip has no pressed state.
  - `dueDateWindow(date, today)` places an ISO date in one of three windows:
    `overdue` (before today), `upTo30Days` (today through today + 30 days) or
    `over30Days`. It is built on `daysPastIsoDate`, so it always agrees with
    the overdue-days marker (`customers.details.reviews.overdueDays`).
  - `filterByDueDate(items, getDate, filter)` keeps the items in the chosen
    window. `all` keeps every item, dated or not.
- The selection is **local state of the view that shows the filter**
  (`useState`, default `all`). It is not written to the URL: this is a
  deliberate exception to ADR 0006 for view-local filters over rows that are
  already loaded. Filters that reach an endpoint stay in the URL.
- `filterByDueDate` works on a **fully loaded collection**. A server-paginated
  list must send the window to its endpoint as a feature filter in the URL
  (ADR 0026) instead of filtering one page in the browser.

## Consequences

- Another view adds the filter with one component, one `useState` and one
  `filterByDueDate` call.
- The choice resets when the view unmounts or the page reloads, and a filtered
  view cannot be shared as a link.
- Until the swap, the chip look is ours — the accent fill and check mark of the
  design — and has to be compared with the IWA chip in the work repo. After the
  swap, only the export in `src/ui/index.ts` changes.

## Alternatives considered

- **Keep the chips in the customers feature.** Rejected: the filter is meant for
  other views, and it knows nothing about customers.
- **Keep the selection in the URL as `filter.<key>` (ADR 0026).** Rejected by
  the product owner: it needs a URL hook, a parser and redirect handling for a
  quick view filter over a few loaded rows that nobody shares as a link.
- **Filter on the server.** Not needed while the rows arrive in full. A paginated
  consumer takes this route, as stated above.
- **Wrap the IWA `Chips` group.** Its documented props (`value`, `onChange`,
  `multiple`, `wrap`) show no check mark for the chosen chip, which the design
  has, and the local stub does not type it. Single `Chip`s with `showSelection`
  match the design. If the real `Chips` turns out to render the mark, wrapping it
  is a drop-in change behind the same `DueDateFilter` contract.
