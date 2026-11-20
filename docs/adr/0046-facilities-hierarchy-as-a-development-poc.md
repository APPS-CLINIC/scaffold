# ADR 0046 — Facilities hierarchy as a development PoC

- **Status:** Accepted
- **Date:** 2026-11-06
- **Refines:** ADR 0013, ADR 0025 and ADR 0028 for the pre-contract PoC only

## Context

Story 15006016 needs Facilities rows nested through six business levels,
including customers whose first available facility is at level three. Children
share their parents' columns, there is no pagination, and "Expand all" must
open every branch. The existing GenericDataTable expands responsive overflow
fields of one record and requires server pagination.

The backend meeting confirmed that neither the Facilities data model nor its
response contract is agreed yet. The frontend should demonstrate a preferred
representation before the teams decide how to transport the hierarchy.

## Decision

- Add a small presentational TreeDataTable adapter over the already-used
  PrimeReact package. It receives nodes, key/children accessors, typed column
  renderers, controlled expansion and labels. PrimeReact TreeNode and event
  types stay inside the UI seam. GenericDataTable remains unchanged.
- Use a single shared column grid and an indented first column. The table
  exposes treegrid semantics, structural ARIA levels and named expansion
  controls. Narrow screens scroll horizontally rather than mixing hierarchy
  expansion with responsive field details.
- Keep the proposed FacilityNode/FacilityRow model in the feature. Stable node
  keys, facility identifiers and business levels are separate. A root at
  business level three has structural depth one; no missing ancestors are
  manufactured. A node key identifies an occurrence in the hierarchy, not its
  current position or merely its facility number.
- Assume one complete forest for the PoC. Synthetic fixtures and their page
  live under src/dev and are loaded only by an import.meta.env.DEV-guarded
  lazy route, /dev/facilities. They do not run in production or replace the
  current customer endpoints. This is a deliberate exception to ADR 0028's
  cache-seeding workflow: there is no real Facilities endpoint to seed.
- The feature demonstrates search, filters, group selection and display
  currency through the existing URL-state seam. Only expansion and open
  information panels are transient local state. Strict filtering inspects the
  full forest, retains nonmatching ancestors as context and initially expands
  the path to matching descendants. A display-currency change preserves
  expansion because it does not change the tree.
- Keep every icon slot. Grey icons explain the absence of data. Hover/focus
  information that can contain an action uses a portalled non-modal dialog;
  it is not presented as a noninteractive tooltip.
- Provide amounts in original, PLN and EUR presentation variants in the
  fixture. The view never computes an exchange rate. Summary values are
  supplied per independent group and summed once for the selected groups;
  parents and descendants are never added together. Search and detailed
  filters do not change the explicitly labelled group summary in this PoC.
- Once agreed, inject the real endpoint into baseApi and adapt its result to
  the feature model. A flat parentId response and a nested response can both
  feed this presentation. Loading children separately would also require
  changes to loading, filtering and expand-all behavior.

## Consequences

The teams can review an interactive six-level hierarchy and download its
proposed data-only model without waiting for an endpoint. This JSON is a
frontend proposal, not an agreed API contract. The mock-up's "Facility" filter
is provisionally interpreted as an inclusive business-level cap.

Production customer navigation, customer list behavior and server-state
ownership remain unchanged. Real forms, dictionaries, FX rates, XLSX export,
summary/filter semantics, final icon vocabulary and performance at the real
maximum volume still require backend/product agreement.

Private IWA packages are unavailable in this workspace. Tests use test-only
IWA/icon doubles and real PrimeReact. Corporate typecheck, build and visual
verification remain required before this PR is mergeable.

## Alternatives considered

- **Add children to GenericDataTable's expansion template.** Its responsive
  field accordion and obligatory pagination would mix two expansion contracts
  and risk the existing customer list.
- **Render a nested table for each child.** Columns drift, headers repeat and
  keyboard navigation spans several unrelated tables.
- **Invent a Facilities HTTP endpoint and seed its RTK Query cache.** The
  meeting explicitly left transport and data modelling open.
- **Wait for the backend.** Prevents validating the component and giving the
  backend team the requested frontend proposal.
- **Fetch one level at a time now.** Assumes a service contract and complicates
  searching hidden descendants and expanding the complete tree.
