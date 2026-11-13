# ADR 0053 — Facilities preview route below /customers

- **Status:** Accepted
- **Date:** 2026-11-13
- **Refines:** ADR 0046's development route

## Context

ADR 0046 registered the development-only Facilities preview at
`/dev/facilities`. The shared environment's nginx forwards only application
prefixes such as `/customers` to the frontend, so `/dev/...` never reaches the
router there. Only the URL is affected; the preview's code, data and
development-only guard are unchanged.

Under `/customers`, the first segment is the customer id slot
(`/customers/:id`). The navigation resolver treats any segment that is not a
static section item as a customer id. A direct child such as
`/customers/dev-facilities` would show the customer-detail sidebar for customer
"dev-facilities", and its links (`/customers/dev-facilities/general-data`)
would be matched by the preview's optional `:facilityId`.

## Decision

- Serve the preview at `/customers/all/dev-facilities/:facilityId?`.
  `all` is the customers section's static item, so the resolver keeps the
  global customers sidebar and never derives a customer context.
- Keep the route at the application level beside the section routes and keep
  the `import.meta.env.DEV` guard. `FACILITIES_PREVIEW_PATH` in `src/dev`
  owns the path for the page, its tests and Storybook; the router repeats the
  literal so it does not import `src/dev` statically.
- `/dev/facilities` is no longer registered and falls through to the 404 route.

## Consequences

The preview is reachable wherever `/customers` is proxied, provided that build
runs with `import.meta.env.DEV`; a production build still excludes it. The
"All customers" sidebar item is not highlighted on the preview because it
matches exactly. Bookmarks to `/dev/facilities` must be updated.

## Alternatives considered

- **`/customers/dev-facilities`.** Collides with the customer id slot, as
  described above.
- **Add a hidden manifest item or teach the resolver an exception.** Changes
  production navigation for a development page.
- **Change the nginx configuration.** Outside this repository and not needed
  for a preview.
