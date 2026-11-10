# ADR 0050 — Group filters keep Facilities lazy

- **Status:** Accepted
- **Date:** 2026-11-10
- **Refines:** ADR 0048 and ADR 0049

## Context

Selecting Lending supplied automatic expansion paths while All supplied none.
The same hierarchy appeared collapsed in All but expanded under Lending,
implicitly fetching descendants on group selection.

## Decision

Group selection scopes the forest without requesting expansion. All means all
groups, including Lending/TFS; it does not mean expand all. Both views initially
expose roots with `hasChildren`. Explicit expansion loads direct children, and
Expand all follows remaining pages recursively. Search and detailed filters keep
their existing path-reveal behavior. Cache and expansion remain query-specific.

## Consequences

Regression tests verify identical subtrees, no implicit child requests on group
selection and explicit asynchronous expansion under both All and Lending.
Counts still include matching descendants not loaded yet.

## Alternatives considered

- Expand all groups automatically: eagerly loads the largest forest.
- Remove hierarchy in All: loses valid data and changes its shape.
