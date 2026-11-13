# ADR 0054 — Flat tree rows with parent stripes

- **Status:** Accepted
- **Date:** 2026-11-13
- **Refines:** ADR 0046's indented first column and its level filter

## Context

The Facilities design shows every row starting at the same position whatever
its depth: no indentation. ADR 0046 used PrimeReact's default indentation of
the first column (16 px per level), which pushes nested content to the right
and misaligns the identity cells. Without indentation, the reader still needs
to see which parent a row belongs to.

The design also shades the "Basic data" column, uses an orange caret for a
closed branch and a dark caret for an open one, and offers the business-level
cap as "Facility level" chips above the toolbar rather than inside the filter
dialog.

## Decision

- TreeDataTable ignores PrimeReact's depth indentation. Every toggle and leaf
  placeholder occupies the same width, so content in every row starts at the
  same x position. `aria-level` keeps the depth available to assistive
  technology.
- Nesting is shown by a 4 px inset stripe on a row's first cell, coloured
  `--tree-branch-<depth>` (six tokens, cycling). An expanded parent and its
  direct children share the colour of the parent's depth, so the stripe names
  the row's parent; an open child starts its own group in the next colour.
  Collapsed roots have no stripe. The stripe is a box-shadow, so it never
  shifts layout.
- The caret is a solid triangle: `--navigation-accent` while a branch is
  closed, `--text` once open.
- Field `headerClassName` and `cellClassName` are merged with twMerge after the
  table defaults, so a field can replace the header surface. Facilities uses
  `--table-key-column` for its "Basic data" column.
- Facilities shows the inclusive level cap (`maxLevel`) as single-select
  "Facility level" chips. The URL parameter and filtering semantics are
  unchanged; the deepest cap remains the default and clears the parameter.

## Consequences

Rows align with the design and nested identity cells keep their full width.
Depth is readable from the stripe colour and the business-level number in the
cell rather than from position. Adjacent open siblings at the same depth share
a colour; their open carets separate the groups. The tokens are defined for the
light theme only, like the rest of `global.css`.

Visual verification against the real IWA theme remains a corporate-environment
check.

## Alternatives considered

- **Keep indentation.** Contradicts the design and misaligns nested rows.
- **One colour per root subtree.** Shows the top-level owner but not the direct
  parent within a deep branch.
- **Stacked stripes for every ancestor.** Reintroduces indentation through the
  stripes themselves.
- **Keep the level cap in the filter dialog.** The design presents it as a
  primary, always-visible choice.
