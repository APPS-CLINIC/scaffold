# ADR 0013 — IWA UI Components behind the `@/ui` seam

- **Status:** Accepted (direction; details depend on access to the IWA repo)
- **Date:** 2026-06-22

## Context

The UI seam (`@/ui`) was established without committing to a concrete library.
The planning meeting made it clear that the organization's internal component
library is **IWA UI Components** (ING), built on **PrimeReact**.

## Decision

BIKS will use **IWA UI Components** behind the `@/ui` seam, and **we will
contribute back** to them:

- `@/ui` prop contracts are designed so the exports become thin wrappers / re-exports
  of IWA components, not generic placeholders.
- Where BIKS needs a component that IWA does not yet provide (or needs a fix or
  extension to an existing one), we **contribute it upstream** to IWA rather than
  forking or building a parallel component locally.
- Until we have access to the IWA repo, the current placeholders stay in place,
  matching the target prop contracts; we swap the implementations in a single
  folder once access is granted.

## Consequences

- The rest of the code (`features/**`, `routes/**`) stays independent of
  PrimeReact — the swap to IWA happens only inside `@/ui`.
- We need observer/contributor access to the IWA repo (a separate spike).
- Contributing upstream keeps BIKS aligned with the organization's design system
  and avoids duplicating components.

## Alternatives considered

- **A bespoke design system.** Duplicates IWA; diverges from the organization's
  standard.
- **Importing PrimeReact directly in features.** Breaks the `@/ui` seam and couples
  code to a specific vendor.
