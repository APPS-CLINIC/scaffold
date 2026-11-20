# ADR 0058 — Facilities preview at /facilities in every build

- **Status:** Accepted
- **Date:** 2026-11-17
- **Supersedes:** ADR 0053
- **Refines:** ADR 0046's development-only guard

## Context

ADR 0053 moved the Facilities preview to `/customers/all/dev-facilities`,
assuming the shared environment's nginx forwards only application prefixes.
Review found no such rule in the nginx configuration, and the preview was still
missing on the environment. The real cause was the route's
`import.meta.env.DEV` guard: the environment runs a production build, so the
route was never registered there.

Product and backend reviewers need to try the preview on the shared
environment. There is no Facilities backend yet, so the simulated preview is
the only way to show the hierarchy.

## Decision

- Serve the preview at `/facilities/:facilityId?` in every build, including
  production builds, until the Facilities backend exists.
- Drop the `import.meta.env.DEV` guard for this route only. The page and its
  simulated data stay in `src/dev/facilities` and stay in their own lazy chunk:
  the router repeats the path literal instead of importing
  `FACILITIES_PREVIEW_PATH`.
- `/facilities` is not a navigation-manifest section, so the preview adds no
  menu item and needs no resolver exception.
- `/customers/all/dev-facilities` and `/dev/facilities` are no longer
  registered.

## Consequences

The preview opens at the same URL locally and on the environment. A production
build now ships the preview's lazy chunk and its synthetic fixture; nothing
loads them unless `/facilities` is opened. When the backend is ready, the real
feature takes over `/facilities` and the preview route is removed or moved
behind a guard again; that change needs a new ADR. Bookmarks to the old URL
must be updated.

## Alternatives considered

- **Keep `/customers/all/dev-facilities` behind a build flag.** Keeps the
  workaround for an nginx rule that does not exist, and the URL is harder to
  share.
- **Keep the development-only guard.** The preview would stay unavailable on
  the environment, which is what reviewers need now.
