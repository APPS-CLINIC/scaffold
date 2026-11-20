# ADR 0057 — Bracket guides span whole rows

- **Status:** Accepted
- **Date:** 2026-11-13
- **Refines:** ADR 0056's arm placement

## Context

ADR 0056 placed both bracket arms at the toggle's centre. Facility rows are
several lines tall, so a bracket closed near the top of its last descendant
row: it appeared to end where the last child begins, not where it ends.

## Decision

A bracket encloses whole rows. Its top arm sits 6 px inside the top edge of the
parent row and its bottom arm 6 px inside the bottom edge of the last visible
descendant row (or pending placeholder). The 6 px inset keeps a closing bracket
from touching a bracket that opens in the row directly below. Gutter, colours,
nesting and the computed guides are unchanged.

## Consequences

Each bracket visibly covers the parent and every row of its open subtree. The
arms no longer line up with the toggle.

## Alternatives considered

- **Arms at the row edges without an inset.** A closing and an opening bracket
  of the same depth in adjacent rows would join into one continuous line.
