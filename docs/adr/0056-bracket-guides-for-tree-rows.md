# ADR 0056 — Bracket guides for tree rows

- **Status:** Accepted
- **Date:** 2026-11-13
- **Refines:** ADR 0054's parent stripes

## Context

ADR 0054 removed indentation and marked rows with one 4 px stripe in the colour
of their parent group. In review the stripe did not show where a group starts
and ends, and nested groups were hard to follow. The requested model is an
editor's bracket-pair guides: matching brackets share a colour and nested pairs
sit inside each other.

## Decision

- Each expanded parent with visible children opens a bracket in
  `--tree-branch-<depth>`: a top arm at the toggle's centre and a vertical line
  down its visible descendants. The bracket closes with a bottom arm on the
  last visible descendant, or on the pending placeholder when more children are
  loading. Rows in between show the line passing through.
- Brackets of nested depths sit side by side, 6 px apart, in a fixed 36 px
  gutter at the start of the first cell (room for five nested brackets, the
  most six business levels need). The gutter is the same for every row, so
  content stays aligned whatever the depth.
- TreeDataTable computes each row's guides while it maps nodes (its depth,
  whether it opens a bracket, and which ancestor brackets close at it) and
  renders them as decorative, absolutely positioned strokes inside the first
  cell. `aria-level` continues to expose depth.

## Consequences

The start, extent and end of every open group are visible, and the colour
matches its parent. The first column reserves 36 px even for a collapsed
table. Brackets deeper than five levels would overlap the toggle; the palette
repeats after six depths. Visual checks against the real IWA theme remain a
corporate-environment task.

## Alternatives considered

- **Keep one stripe per row (ADR 0054).** Does not show where a group ends.
- **Size the gutter to the deepest open level.** Content would shift sideways
  each time a deeper level opens.
- **Indent the content.** Rejected by the design (ADR 0054).
