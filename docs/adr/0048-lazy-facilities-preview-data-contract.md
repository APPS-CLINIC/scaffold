# ADR 0048 — Lazy Facilities preview data contract

- **Status:** Accepted
- **Date:** 2026-11-09
- **Refines:** ADR 0046's complete-forest assumption and ADR 0047's shared UI contract

## Context

The development JSON download exposed a complete nested forest. That could not
represent a branch whose children exist but have not been fetched. The agreed
frontend direction is to load direct children on expansion and fetch the whole
hierarchy only when requested. Development data and its download must exercise
that contract, rather than adding an unused flag to the old full-tree fixture.

The real Facilities backend contract remains unavailable. This decision defines
the frontend proposal and its development simulation, not an agreed HTTP API.

## Decision

- Use a flat FacilityNodeDto with key, parentKey, businessLevel, hasChildren,
  childrenCount and data. childrenCount counts direct children for the current
  query. Neither nested children nor client loading state is a transport field.
- Return bounded sibling pages: parentKey, nodes, total and nextCursor.
  The root response adds asOf, independent summaries and query-wide counts,
  dictionaries, context keys and paths to reveal. Cursors are scoped to the
  parent/query. The simulation uses offsets; production cursors remain a
  backend decision.
- Keep the loaded projection separate: FacilityNode adds children,
  childrenState (unloaded/loading/loaded/error) and nextCursor. A loaded page
  with a remaining cursor is incomplete. TreeDataTable uses the supplied
  has-children accessor independently of the loaded child array.
- Store data in the single baseApi cache. Development-only injected queryFn
  operations simulate roots and children without inventing HTTP endpoints.
  Child pages merge into the root projection while the original response
  remains unchanged for the JSON download.
- Filter the complete catalogue in the simulated service. Use response-wide
  counts, dictionaries and ancestor context rather than counting only loaded
  nodes. Display currency does not invalidate child requests.
- Fetch one branch on expansion, retain pages through collapse, and offer
  continuation/retry per branch. Expand all follows remaining pages
  sequentially and recursively. It supports cancellation and ignores stale
  expansion results after a query or page change.
- Keep the same flat DTO in the dev catalogue, service responses and download.
  Download the initial root response even after descendants have been loaded.
  Detail examples are looked up independently.

## Consequences

The preview demonstrates incremental loading and exports a backend discussion
artifact. Shared fields, cells, hover styling and IWA Popover integration stay
in place. Single-child pages deliberately exercise sibling continuation.

The simulated service necessarily has its small catalogue in the development
bundle. It is not a production memory/throughput benchmark. Virtualization,
real backend integration and agreed DTO mapping remain separate work. No
synthetic data is routed into the production customer Limits page. Private
IWA typecheck/build/visual validation limitations still apply.

## Alternatives considered

- Add hasChildren but still send all descendants: leaves the lazy lifecycle
  untested and exports the wrong service contract.
- Treat an empty child array as a leaf: hides expansion for unfetched branches.
- Search only fetched nodes: silently misses valid descendants.
- Invent production URLs for a mock server: misrepresents an unagreed backend
  contract and makes the simulation look like a finished integration.
