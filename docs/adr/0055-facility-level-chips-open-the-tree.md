# ADR 0055 — Facility level chips open the tree

- **Status:** Accepted
- **Date:** 2026-11-13
- **Refines:** ADR 0046's level-cap interpretation and ADR 0054's level chips

## Context

ADR 0046 provisionally read the mock-up's level control as an inclusive cap,
and ADR 0054 kept that meaning (the `maxLevel` filter) when it moved the
control to chips. In review, choosing "1, 2, 3, 4, 5" seemed to open the tree
to level five, but "1, 2, 3, 4, 5, 6" collapsed everything again. The opening
was a side effect: a non-default cap counted as a filter, so matching paths
were revealed; the default cap did not, so nothing opened and level five never
showed its children.

The design selects "1" by default while a deeper row is open by hand, which
only makes sense if the chips choose how far the tree is opened rather than
which rows exist.

## Decision

- "Facility level 1, …, N" expands every branch whose business level is below
  N, so all levels down to N are visible. "1" collapses the tree; the deepest
  choice equals Expand all, and the Expand all switch maps to "1" and the
  deepest choice.
- Lazy owners provide `onExpandToLevel(level, signal)`. The preview reuses the
  Expand all traversal (remaining root pages, then sibling pages) and only
  descends into nodes below the level. Without it, the view opens the branches
  it already has.
- The chip records the last opened level. Manual toggles keep working and do
  not change it. A new query resets it to "1" together with the expansion.
  Cancelling or a failed page restores the previous chip.
- It is not a filter: `maxLevel` is removed from the filter schema, the
  simulated service and the backend proposal. Old URLs that still carry it
  are ignored.

## Consequences

Every chip behaves the same way, including the deepest one, and rows are never
hidden by the level choice. Opening deep levels loads pages sequentially like
Expand all and shows the same cancellable status. Whether the backend should
offer a depth-limited response for this remains open.

## Alternatives considered

- **Keep the cap and also expand to it.** Two meanings on one control; rows
  below the cap would become unreachable by manual expansion.
- **Store the chosen level in the URL.** Expansion is transient view state
  (ADR 0046); a shared link would trigger page loading on open.
