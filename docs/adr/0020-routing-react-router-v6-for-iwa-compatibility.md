# ADR 0020 — React Router v6 for IWA compatibility

- **Status:** Accepted
- **Date:** 2026-07-07
- **Supersedes:** [ADR 0012](0012-routing-react-router-v7.md)

## Context

[ADR 0012](0012-routing-react-router-v7.md) selected React Router v7 before
the IWA component stack was integrated. `iwa-react-components` requires
`react-router-dom@^6.30.3` as a peer dependency, so keeping v7 creates a major
version mismatch and prevents a clean dependency installation.

The scaffold uses `createBrowserRouter`, `RouterProvider`, `Outlet`, `Link`,
`useNavigate`, and `useSearchParams`. These APIs are available in React Router
v6 and do not require v7-specific behavior.

## Decision

We use **React Router v6** and pin `react-router-dom` to the compatible
`^6.30.3` range. The existing browser-router structure and URL-driven state
architecture remain unchanged.

Any future router major upgrade must be coordinated with the IWA peer
dependency range rather than forced through an override.

## Consequences

- The dependency graph installs without a React Router peer-version conflict.
- IWA components and the application share a single router runtime.
- The URL-as-source-of-truth architecture keeps the same public APIs and needs
  no migration.
- React Router v7-only features are unavailable until IWA supports that major.

## Alternatives considered

- **Keep v7 and override the IWA peer dependency.** Risks duplicate or
  incompatible router behavior inside IWA components.
- **Isolate IWA behind a separate router runtime.** Adds unnecessary
  complexity and breaks shared navigation context.
- **Remove IWA dependencies.** Conflicts with the organization UI direction in
  [ADR 0013](0013-iwa-components-primereact.md).
