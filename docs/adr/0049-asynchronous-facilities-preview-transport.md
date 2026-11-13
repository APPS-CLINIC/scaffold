# ADR 0049 — Asynchronous Facilities preview transport

- **Status:** Accepted
- **Date:** 2026-11-10
- **Refines:** [ADR 0048](0048-lazy-facilities-preview-data-contract.md)

## Context

The Facilities preview already sends flat root and sibling DTO pages with
`hasChildren`, but synchronous query functions complete immediately. This hides
the interval between expanding a branch and receiving its children. Cancelling
expand-all previously stopped subsequent loads without aborting the current one.

## Decision

- Keep the pure service-side catalogue/query functions and the existing DTOs.
  Add a development-only asynchronous transport with a deterministic 500 ms
  response delay for each requested root or sibling page.
- Pass RTK Query's `AbortSignal` to that transport. Abort clears the pending
  timer; the service does not evaluate or return the cancelled page.
- Clone each response to model deserialization without sharing objects with
  the simulated service catalogue. No descendants or UI loading state are added
  to the transport response.
- Wire expand-all's signal to its active RTK Query request. Cancellation undoes
  the branch/root pending-state patch; an intentional abort does not become a
  retryable branch error. Already received pages remain cached.
- Exercise the delay, pending states, abort and retry using fake timers. Tests
  and the running preview use the same asynchronous implementation.

## Consequences

The development page shows initial and per-branch pending states, keeps loaded
siblings visible during continuation, and allows cancelled branches to be opened
again. Collapse/reopen and display-currency changes retain cached pages.

This is a development transport simulation, not a production backend connection
or an agreed HTTP API. No endpoints or dependencies are added. The existing
private UI dependency validation boundary still applies.

## Alternatives considered

- **Only show a loading animation.** Does not exercise pending requests or abort.
- **Delay rendering after loading the complete tree.** Violates the lazy DTO
  contract and hides eager descendant loading.
- **Use random delays or real timers in tests.** Makes request ordering and
  cancellation checks harder to reproduce.
