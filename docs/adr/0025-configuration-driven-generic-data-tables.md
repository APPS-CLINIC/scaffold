# ADR 0025 — Configuration-driven generic data tables

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Data-heavy features need a reusable table that can display different row
shapes without duplicating pagination, sorting, loading, and expandable-row
presentation. The primary columns need feature-specific cell components, while
the expanded content must expose only explicitly approved fields.

The first data source is a mock JSON payload, but the component must be ready
for a backend endpoint. Mixing render instructions into that payload would
create a non-serializable API contract. Letting the table fetch data or own
query state would also conflict with the existing RTK Query and URL-state
boundaries.

PrimeReact is the current implementation target behind `@/ui`, but feature
code must remain independent of its component, event, and state contracts.

## Decision

We expose a generic data-table primitive through `@/ui` with a typed,
vendor-neutral public contract. Its implementation may compose PrimeReact's
`DataTable` and `Column`, but PrimeReact types and props do not cross the UI
seam.

The table follows these boundaries:

- The table is presentational. It receives rows, display state, a static table
  configuration, and callbacks for user intent; it does not fetch data,
  select from Redux, or navigate.
- The static configuration is TypeScript source, generic over the row type.
  Every primary column selects a typed React component for its cells and
  declares the translation key for its heading. Component types and functions
  are never read from JSON.
- Expanded-row details use an ordered, explicit field allowlist from the same
  configuration. Each entry identifies a valid row field and its label
  translation key. The table never discovers detail fields with
  `Object.keys`, renders the entire row object, or displays undeclared response
  fields.
- Runtime JSON contains data only. The initial mock conforms to the same
  feature endpoint result contract expected from the backend, so replacing the
  mock transport does not change the table configuration or its public API.
- A feature injects its endpoint into the shared `baseApi`. RTK Query owns
  request lifecycle, caching, and server state; the feature container maps the
  query result into the table's presentational props.
- Search, filters, sorting, page, and page size remain queryable view state in
  the URL. The feature container reads the validated Redux mirror and handles
  table callbacks through the URL-state write API. The table does not keep a
  competing copy of those values. The extensible filter contract and default
  pagination are defined separately by
  [ADR 0026](0026-extensible-feature-filters-in-list-urls.md).
- Expanded row identity is ephemeral interaction state and stays local to the
  rendered table. It is not stored in the URL or Redux.
- User-visible table headings, detail labels, empty states, and status text are
  resolved through the existing i18n messages rather than embedded in runtime
  data.

## Consequences

- Features can reuse one table implementation while retaining fully custom,
  type-checked primary cells.
- Feature code is insulated from PrimeReact, so the organization library can
  replace or wrap the implementation inside `@/ui`.
- Backend payloads remain serializable and cannot select arbitrary frontend
  components.
- New backend fields are not exposed automatically; a developer must
  intentionally add them to the detail allowlist and translations.
- A feature page must provide the small adapter between URL-backed query state,
  RTK Query arguments, and table callbacks.
- Row expansion does not survive reloads or produce shareable links. This is
  intentional because expansion is transient presentation state, not a data
  query.
- Configuration types are more explicit than an inferred column model, but
  invalid row keys and incompatible cell components fail at compile time.

## Alternatives considered

- **Import PrimeReact directly in each feature.** Rejected because it leaks the
  vendor contract and duplicates table behavior outside the `@/ui` seam.
- **Put component names or rendering instructions in JSON.** Rejected because
  data transport should remain serializable and must not control executable UI
  behavior.
- **Infer expanded details from every property in a row.** Rejected because a
  backend response can gain internal or sensitive fields that must not become
  visible automatically.
- **Let the generic table own fetching and URL synchronization.** Rejected
  because it couples presentation to one endpoint and creates competing owners
  for server and queryable view state.
- **Store expanded rows in Redux or the URL.** Rejected because this transient
  interaction does not need cross-feature coordination, persistence, or link
  sharing.
