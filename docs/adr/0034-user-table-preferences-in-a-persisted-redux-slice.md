# ADR 0034 — User table preferences in a persisted Redux slice

- **Status:** Accepted
- **Date:** 2026-09-11
- **Refines:** [ADR 0025](0025-configuration-driven-generic-data-tables.md)

## Context

Users of the customer list can choose which fields of the generic table are
used and in what order. The choice has to survive a reload, apply before the
first paint (no flash of the default columns), and later follow the user
across browsers through a backend endpoint that does not exist yet.

The application owns two categories of state: server cache in RTK Query
([ADR 0007](0007-redux-toolkit-and-rtk-query.md)) and queryable view state in
the URL ([ADR 0006](0006-url-as-single-source-of-truth.md),
[ADR 0026](0026-extensible-feature-filters-in-list-urls.md)). A column
preference is neither. It is not a fact the backend reported, and a shared
link must not impose the sender's layout on the recipient. The generic table is
presentational and never reads Redux
([ADR 0025](0025-configuration-driven-generic-data-tables.md)), so the
preference cannot live inside the table either.

The only `localStorage` precedent in the codebase, the sidebar collapse flag,
writes from an unguarded effect on mount — twice under `StrictMode`. Copying
that shape for a column list would freeze the complete configured field list
into storage on a user's first visit, so a field added to the configuration
later would never reach that user.

Two earlier decisions bear on the shape of the solution.
[ADR 0009](0009-reselect-and-listener-middleware.md) says features register
listeners through a side-effect import in `store.ts`.
[ADR 0033](0033-customer-detail-presentation-feature-local.md) deleted generic
layers that had exactly one consumer; a generic settings slice serving one
table today has to justify itself against it.

## Decision

We introduce a **third state category — user preferences** — in a generic
Redux slice `tableSettings` under `src/features/tableSettings/`:

```ts
interface TableSettingsState {
  tables: Record<string, { columns: string[] }>; // keyed by GenericDataTableConfig.id
}
```

- **Field names only.** The slice stores the chosen field names in display
  order, never field configurations: cell components are functions and stay in
  TypeScript source (ADR 0025). The static configuration remains the base; the
  pure `resolveColumnFields` applies the stored list to `config.fields`, drops
  names the configuration no longer knows, and falls back to the configured
  fields when nothing remains. `useTableColumnSettings(config)` does this
  resolution in the feature and hands the effective configuration to the
  table, which stays presentational.
- **Hydrated before the first render.** `main.tsx` preloads
  `makeStore({ tableSettings: createTableSettingsState(storage.read()) })`,
  the same pre-render initialization ADR 0026 established for the URL mirror.
  Storage is untrusted input: a Zod schema parses a versioned envelope totally,
  entry by entry, with bounds on ids, names and list length. An unparsable
  payload or entry is ignored — never repaired and never rewritten.
- **A storage port.** `TableSettingsStorage { read(): unknown; write(state): void }`
  has one adapter today, `localStorage` under `scaffold.tableSettings`.
  Replacing it with a per-user backend endpoint means implementing the port
  over that endpoint; the slice, the hook and the dialog do not change.
- **Written on Save and Restore only.** A listener matches
  `tableColumnsSaved` and `tableSettingsRestored` and writes the whole slice.
  Hydration, rendering and editing the dialog's draft write nothing, so
  storage can only ever hold what a user explicitly saved.
- **Delta rule.** Saving a list equal to the configuration default removes
  the table's entry instead of storing it. Storage therefore holds only
  customized tables, and a field added to the configuration reaches every
  user who never customized that table.
- **The listener is registered by the app shell**, not by a module-scope
  side-effect import as ADR 0009 describes. `listenerMiddleware` is a module
  singleton prepended into every store `makeStore` builds, including every
  test store; a registration at module scope would arm a storage writer in
  every test file that builds a store. `startTableSettingsPersistence(storage)`
  is called once in `main.tsx` after `makeStore` and returns the unsubscribe;
  a test that wants a writer registers one with an in-memory storage and
  unsubscribes afterwards. Listeners remain the home for reactive side
  effects; only the registration point moves.
- **Generic by design**, although the customer list is the only table today.
  The table itself is `GenericDataTable<T>`, so its settings are keyed by
  `GenericDataTableConfig.id` (optional on the base type, required by the
  hook). More list pages built on the same table and a per-user settings
  endpoint are the product direction; a customer-only slice would be rewritten
  into this shape by the second table. This differs from ADR 0033, where the
  deleted layers were shaped around one screen's irregular layout.

## Consequences

- Column preferences survive reloads, apply on the first render, and never
  leak into shared links.
- Any table configured with an `id` gets persisted settings through one hook
  call; the table component gains no new props and no Redux dependency.
- `RootState` gains `tableSettings`; feature code reads it through
  `selectStoredTableColumns` and the hook, never by shape.
- Storage payloads are versioned from day one. A future shape bumps the
  version and drops what it cannot read — no migration code.
- Stale stored names (a renamed or removed field) are dropped at resolution
  time and disappear from storage with the user's next save.
- Every store built in a test is writer-free; a test asserting persistence
  registers the listener explicitly and cleans it up, which is the one
  ceremony this buys.
- `main.tsx` grows by three untested lines; the parsing they rely on is
  tested in the factory and the storage adapter.
- Preferences are per browser until the backend endpoint exists; the port
  makes that swap a single-file change.

## Alternatives considered

- **Store the column list in the URL.** Rejected: a preference is not view
  state. A link would impose the sender's layout on the recipient, a
  bookmark would pin a layout the user later changed, and twenty-five field
  names would bloat every URL.
- **An RTK Query endpoint backed by `localStorage` through `queryFn`.**
  Rejected: cache semantics (staleness, refetch, unused-data eviction) describe
  server facts, not a local preference; the write path would hide inside the
  cache lifecycle; and the real endpoint, when it arrives, is a one-line port
  implementation anyway.
- **Per-component state in `CustomersView` with its own `localStorage`
  reads and writes.** Rejected: the read would happen at mount (either a flash
  or a lazy initializer duplicated per table), nothing could select the
  preference outside the view, and the write path would repeat the sidebar's
  mount-write shape.
- **Write storage directly from the Save handler, without middleware.**
  Rejected: the handler would need the storage injected, and the rule "write
  the whole slice after these two actions" would be repeated by every table's
  owner. One matcher in one listener keeps a single writer.
- **Register the listener by side-effect import in `store.ts` (ADR 0009 as
  written).** Rejected for the reason above: it would arm a writer in every
  test store.
- **A customer-specific slice.** Rejected: the table is generic, the second
  table would force the rename, and the stored payload is field names only —
  nothing customer-shaped would be simpler.
