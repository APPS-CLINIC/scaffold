# Generic Data Table and Customer List

This document describes the generic, server-driven table introduced with the
customer list, why the implementation is split across the UI, feature, route,
and data layers, and how to reuse it for future list pages. The related ADRs
remain the authoritative record of the architectural decisions; this note
documents their concrete implementation.

## Outcome

The change provides a reusable `GenericDataTable<T>` built on the IWA
`PaginatorTable` (PrimeReact underneath) and a first integration for
customers. The table is generic over the row type, but it does not attempt to
infer presentation from backend JSON. A typed TypeScript configuration
declares **one flat `fields` list** — every field can render as a column —
and explicitly defines:

- which React component renders every cell (column and accordion alike);
- which fields can be sorted and which backend sort field they use;
- the single translated label per field (`labelKey`);
- the pixel `width` each field occupies as a column;
- which fields are pinned (`alwaysVisible`);
- whether expansion behaves as a single-row accordion;
- an optional `id` naming the config, so table settings can be stored per
  table.

Which fields render as columns is decided **at runtime**: the table measures
its container and shows, in `fields` order, as many columns as fit without
horizontal scrolling; the remaining fields drop into the expanded-row
accordion (last column drops first). When the currently sorted column drops,
the table raises `onSortClear` so the owner can reset the sort in the URL.
A user-chosen subset and order is applied before the config reaches the table:
the pure `resolveColumnFields(fields, columns)` from `@/ui` maps an ordered
list of field names to the configured field configs (unknown and repeated
names dropped, empty result falling back to the configured `fields`), and the
owner passes a config with the resolved `fields`. The table itself only ever
sees `fields`.

The result keeps the reusable behavior in one place while allowing each list
feature to decide how its domain values should look.

## Responsibility boundaries

```text
URL search parameters
        |
        v
validated URL state -> Redux mirror -> feature selector
                                        |
                                        v
                              RTK Query endpoint -> backend
                                        |
                                        v
route page -> feature view -> GenericDataTable<T> -> PrimeReact
                    |                  |
                    |                  +-- local row expansion
                    +-- table config and translated labels
```

Each layer has one responsibility:

- The **URL** owns shareable query state: search, feature filters, sort, page,
  and page size.
- The **Redux URL mirror** exposes that validated state to selectors. It does
  not become a second source of truth.
- **RTK Query** owns remote customer data, request state, and caching.
- The **feature view** connects URL state, the endpoint, translations, and the
  table callbacks.
- **`GenericDataTable<T>`** owns reusable table presentation and translates its
  vendor-neutral props to PrimeReact.
- **PrimeReact** remains an implementation detail behind the `@/ui` seam.
- Expanded rows are transient presentation state and remain local to the view
  or table.

This separation is why the generic table does not import Redux, call an
endpoint, or mutate the URL itself.

## Typed configuration per cell

The public configuration is generic over the complete row type. Every field
correlates its `field` with the `value` accepted by its cell component, so
incompatible combinations fail during TypeScript compilation.

```tsx
export const customerTableConfig = {
  dataKey: 'id',
  singleRowExpansion: true,
  fields: [
    {
      field: 'fullName',
      labelKey: 'customers.table.field.fullName',
      component: UnderlinedTextCell,
      sortable: true,
      width: 192,
      alwaysVisible: true,
    },
    {
      field: 'status',
      labelKey: 'customers.table.field.status',
      component: ActiveArchivalStatusCell,
      sortable: true,
      width: 112,
    },
    { field: 'taxId', labelKey: 'customers.table.field.taxId', sortable: true, width: 128 },
    { field: 'rmAdvisor', labelKey: 'customers.table.field.rmAdvisor', sortable: true, width: 176 },
  ],
} satisfies GenericDataTableConfig<Customer>;
```

Every configured component receives the same typed contract:

- the complete `row` for renderers that need related values;
- the field-specific `value`;
- the `field` name;
- the active `locale`;
- the translated fallback for unavailable values;
- the visible `rowIndex`.

Components are referenced directly from TypeScript rather than by a string in
JSON. This keeps the backend response serializable, prevents server data from
selecting executable UI behavior, and preserves static type checking.

## Cell component organization

Reusable cell renderers live under `src/ui/GenericDataTable/cells`, with every
public cell component in its own file:

- `TextCell` for ordinary primitive text;
- `UnderlinedTextCell` for link-like primary values;
- `DateCell` for locale-aware date formatting;
- `ActiveArchivalStatusCell` for ACTIVE/ARCHIVAL status presentation.

These cells are domain-neutral building blocks exported through `@/ui`. The
customer feature composes them in its configuration and adds a renderer of its
own only where the presentation is domain-specific: the customer table's
`customerTable/OverdueDateCell.tsx` wraps the feature's `OverdueDate`, which
shows the IWA "incomplete" status with the number of days overdue above a past
review or pricing date. A reusable renderer belongs beside the generic table;
a domain-flavoured one stays in its feature.

Small internal helpers, such as safe value handling, remain private to the
table package; status presentation renders the shared IWA `Status` component.
IWA components are re-exported through the `@/ui` barrel for feature code,
while modules inside `src/ui` import `iwa-react-components` directly. Table
classes are combined with IWA's `twMerge`, allowing feature-supplied Tailwind
classes to override defaults without conflicting utilities.

## Explicit expanded-row allowlist

`fields` is an ordered allowlist, not a convenience list derived with
`Object.keys(row)`. Only declared fields are rendered anywhere — as columns
or after expansion. This is important because a backend response may later
gain internal or sensitive properties that must not appear automatically. The
accordion content is not configured separately: it is exactly the ordered
remainder of `fields` that did not fit as columns, and the expansion toggle
column renders only while that remainder is non-empty.

Primitive values receive a safe default renderer. A non-primitive field must
declare a typed component, which prevents an object from being exposed through
accidental stringification. Missing values use the translated `notAvailable`
label.

Rows behave as a single-row accordion by default. The table also supports
controlled `expandedRowKeys`; the customer view uses this seam for its
"expand all" control. Expansion is intentionally absent from Redux and the URL
because it is temporary UI state rather than a shareable data query.

## Server-driven data operations

PrimeReact runs in `lazy` mode. The browser does not calculate customer
filtering, sorting, pagination, or totals:

- `page`, `pageSize`, `sortField`, and `sortOrder` are controlled props;
- paginator and sorting events emit vendor-neutral callbacks;
- the feature writes those changes to the URL;
- the updated URL mirror creates a new RTK Query argument;
- the backend returns the requested content and authoritative totals;
- `page.totalElements` is passed to the table as `totalRecords`.

Application pages are consistently 1-based. The customer endpoint adapter
converts them to the backend's 0-based Spring convention and creates requests
such as:

```http
GET /api/customers?page=0&size=10&sort=id%2CASC
```

The response contract is represented explicitly:

```ts
interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
```

Sort fields are checked against a customer-specific allowlist before a request
is sent. Invalid fields fall back to `id`, and invalid page values are safely
normalized. Search and customer filters are also validated before they enter
the endpoint contract.

The visible customer page currently omits search and filter controls because
they are planned for a separate change. Their feature-level schema and URL/BE
mapping remain in place, so later controls can use the established data flow
without moving filtering into the browser.

## Why there is no customer slice

A separate customer slice would duplicate RTK Query's server cache and create
two possible owners for loading state, errors, freshness, and entities. It is
not needed here:

- RTK Query owns customer server state;
- the URL owns queryable list state;
- the existing URL slice mirrors that state for selectors;
- React state owns row expansion.

A customer slice should be introduced only for customer-specific client state
that is neither server cache nor URL state and genuinely needs coordination
outside the current view.

The one piece of client state the list does keep — which fields the user chose
as columns, and in what order — is not customer-specific either. It lives in
the generic `tableSettings` slice (`src/features/tableSettings`), keyed by the
config's `id`, hydrated from storage before the first render and written only
when the user saves or restores defaults. `useTableColumnSettings(config)`
resolves the effective configuration from it; the table itself never reads
Redux. See
[ADR 0034](adr/0034-user-table-preferences-in-a-persisted-redux-slice.md).

## Transport model and response adapter

`CustomerResponse` follows the backend payload, including its strings and
nullability. `Customer` is the application-facing row model. The response
adapter normalizes backend status vocabulary at the RTK Query boundary, for
example Polish or English active/inactive values into stable application
unions.

This prevents reusable cells from knowing transport vocabulary and gives the
rest of the UI a predictable model. A changed backend contract therefore has a
single adaptation point instead of leaking conditional parsing into cells.

## Development preview without a mock API

The application always retains the real customer endpoint. When the backend is
temporarily unavailable, a developer can opt into one initial preview entry by
creating `.env.development.local` with:

```dotenv
VITE_PREVIEW_DATA_PROFILE=customers
```

At development bootstrap, the profile seeds only the default first-page RTK
Query cache key with `upsertQueryEntries`. The fixture passes through the same
response adapter as live data. This is an initial cache value, not a mocked API:

- changing page, page size, sort, search, or filters calls the backend;
- the refresh action calls the backend;
- the endpoint implementation is never switched;
- preview modules are dynamically imported only in development and are absent
  from the production bundle.

The preview is deliberately narrow: it makes the initial layout inspectable,
but it does not emulate backend behavior in the browser.

## Routing and feature placement

The router does not import the customer feature directly. The customers route
registry lazy-loads `CustomersPage` from `src/routes/pages/customers`, and that
small route-level page renders `CustomersView` from the feature. This keeps
route composition under `routes/pages` while customer data and presentation
orchestration remain feature-owned. The section-scoped registry also scales to
additional pages without adding feature-specific conditions to the router.

## Styling, translation, and accessibility

- The table uses PrimeReact through `@/ui`. Table chrome (borders, header
  rule, muted text) uses the semantic design tokens; the IWA components it
  renders (`Status`, `InlineLink`, the skeleton) carry the IWA brand palette
  internally, exactly as the real library does.
- Tailwind classes are merged with IWA's `twMerge` utility.
- `loading` drives the in-place loading overlay; the separate `initialLoading`
  prop (true only while the very first load is in flight, e.g. RTK Query's
  `isLoading`) swaps in the IWA table skeleton. Once the table has rendered,
  the skeleton never returns — refetches must not unmount the table, so focus
  and the overlay survive.
- Field label keys are typed against the i18n catalog and resolved at render
  time, so switching language does not rebuild the static config.
- Empty, loading, error, pagination, expansion, and unavailable-value text is
  translated.
- The table, paginator, loading state, expansion controls (including the
  screen-reader name of the toggle column), and expanded regions have
  accessible names or relationships.
- The table never scrolls horizontally: the responsive fit engine moves
  columns that would overflow into the expanded-row accordion instead.

## Adding another list page

1. Define separate transport and application row types when the backend values
   require normalization.
2. Inject the feature endpoint into the shared `baseApi` and adapt its response
   at that boundary.
3. Derive endpoint arguments from validated URL state. Convert page numbering
   and allowlist server sort fields in the feature adapter.
4. Reuse cells exported by `@/ui`. Add one component per file under the generic
   table only for a new domain-neutral renderer.
5. Create a typed feature table config: one flat `fields` allowlist with a
   label, width, and (where needed) cell component per field.
6. Connect the endpoint, URL callbacks, translated labels, and config in the
   feature view.
7. To let users choose and order the columns, give the config an `id`, pass
   `useTableColumnSettings(config).config` to the table instead of the static
   config, and render `GenericTableSettings` with `onOpenSettings` plus
   `TableColumnSettingsDialog` from `@/ui`, whose `onSave` and
   `onRestoreDefaults` call the hook's `saveColumns` / `restoreDefaults` and
   collapse the expanded rows (`CustomersView` is the reference).
8. Add a route-level page and register its lazy loader in the appropriate
   section page-route module.
9. Add translations and tests for the endpoint mapping, config invariants,
   feature integration, and any new reusable cell.

## Relevant files

- [`src/ui/GenericDataTable/GenericDataTable.types.ts`](../src/ui/GenericDataTable/GenericDataTable.types.ts)
  — generic public contracts.
- [`src/ui/GenericDataTable/GenericDataTable.tsx`](../src/ui/GenericDataTable/GenericDataTable.tsx)
  — presentational table orchestration.
- [`src/ui/GenericDataTable/GenericDataTable.prime.ts`](../src/ui/GenericDataTable/GenericDataTable.prime.ts)
  — isolated PrimeReact event and pass-through mapping.
- [`src/ui/GenericDataTable/cells`](../src/ui/GenericDataTable/cells)
  — reusable cell components.
- [`src/features/customers/customerTable/config.ts`](../src/features/customers/customerTable/config.ts)
  — customer-specific composition of the generic contract.
- [`src/features/customers/customers.api.ts`](../src/features/customers/customers.api.ts)
  — backend parameter adapter and injected RTK Query endpoint.
- [`src/features/customers/customers.adapter.ts`](../src/features/customers/customers.adapter.ts)
  — transport-to-application value normalization.
- [`src/features/customers/customers.filters.ts`](../src/features/customers/customers.filters.ts)
  — customer-owned URL filter validation.
- [`src/features/customers/CustomersView.tsx`](../src/features/customers/CustomersView.tsx)
  — feature integration.
- [`src/ui/GenericDataTable/useResponsiveFields.ts`](../src/ui/GenericDataTable/useResponsiveFields.ts)
  — responsive column/accordion fit engine.
- [`src/ui/GenericDataTable/resolveColumnFields.ts`](../src/ui/GenericDataTable/resolveColumnFields.ts)
  — pure resolver applying an ordered field-name list to the configured fields.
- [`src/ui/GenericDataTable/settings`](../src/ui/GenericDataTable/settings)
  — the "List settings" dialog, its sortable rows and the pure draft reducer.
- [`src/features/tableSettings`](../src/features/tableSettings)
  — persisted column settings: slice, schema, storage port, listener and
  `useTableColumnSettings`.
- [`src/routes/pages/customers/CustomersPage.tsx`](../src/routes/pages/customers/CustomersPage.tsx)
  — route-level page boundary.
- [`src/dev/previewData`](../src/dev/previewData)
  — opt-in development cache seed and fixture.

## Architecture references

- [ADR 0006 — URL as the single source of truth](adr/0006-url-as-single-source-of-truth.md)
- [ADR 0007 — Redux Toolkit and RTK Query](adr/0007-redux-toolkit-and-rtk-query.md)
- [ADR 0013 — IWA Components and PrimeReact behind the UI seam](adr/0013-iwa-components-primereact.md)
- [ADR 0025 — Configuration-driven generic data tables](adr/0025-configuration-driven-generic-data-tables.md)
- [ADR 0026 — Extensible feature filters in list URLs](adr/0026-extensible-feature-filters-in-list-urls.md)
- [ADR 0027 — Section-scoped lazy page route modules](adr/0027-section-scoped-lazy-page-route-modules.md)
- [ADR 0028 — Development preview data through RTK Query](adr/0028-development-preview-data-through-rtk-query.md)

## Validation

The implementation has unit and component coverage for the generic table,
PrimeReact event mapping, reusable cells, customer configuration, URL filter
parsing, backend request mapping, response normalization, feature rendering,
and development preview behavior. The repository quality gates are lint,
strict typecheck, tests, and a production build.
