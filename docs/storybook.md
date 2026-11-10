# Table component catalogue

Storybook renders the existing table components, their configured cells and
surrounding controls. It runs separately from the application and does not
replace `/dev/facilities` as an integration check.

## Commands

Use the Node version in `.nvmrc`, install dependencies in an environment with
access to the private UI packages, then run:

```bash
npm run storybook
```

Open **http://localhost:6006**. The Guide describes the catalogue. Canvas supports
interaction; Docs explains each contract; Controls adjusts the example owners.
The language toolbar selects English or Polish without saving a preference.

```bash
npm run build-storybook   # static catalogue in storybook-static/
```

For browser play tests, install Chromium once:

```bash
npx playwright install chromium
npm run test-storybook
```

The Vitest addon executes stories and their play assertions in headless Chromium;
it does not require a separately running Storybook server. The accessibility addon exposes checks in Storybook. Its
configured failures remain errors; actual results require the real UI packages.
No snapshots or automatic publishing are configured.

## Catalogue

| Group            | Examples                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GenericDataTable | Paging, sorting, responsive details, toolbar, loading, empty/error/retry, async pages, 10,000 service records, missing and long values, Polish                                             |
| TreeDataTable    | Collapsed/expanded hierarchy, unloaded branch, loading and empty                                                                                                                           |
| Facilities       | Root-only entry, lazy Lending, slow responses, root/branch failure and retry, deep search, cancel expand-all, large sibling/root pages, currencies and Polish                              |
| Table controls   | TableToolbar at several widths, TableActions, GenericTableSettings, GenericSearch, TableFilters, individual filter controls, asynchronous option search, DueDateFilter and column settings |
| Feedback         | ListToolbarSkeleton, SkeletonTable, LoadingSpinner and InfoPopover with keyboard/interactive content                                                                                       |
| Cells            | Shared text, internal link, date, overdue date, active/archival and missing values                                                                                                         |

## Pending-state examples

GenericDataTable and TreeDataTable render the same TableCellSkeleton. Facilities
keeps its configured grid and headers mounted, uses ListToolbarSkeleton before
its first response and reuses the existing loading timing. Child/root
continuation adds placeholders without removing loaded siblings. Inspect the
Loading and LoadingMoreRoots stories, or the slow Facilities response.

## Data and isolation

`src/stories/StoryProviders.tsx` creates a store, router, URL state and cloned
i18n instance for each example. Settings are not persisted. Unmounting aborts
running requests and removes that store's API cache.

Facilities stories render `FacilitiesPreviewPage` with the same RTK Query
endpoints as the dev route. A per-store transport supplies a scenario's data and
latency. The shared pure service remains responsible for filtering and paging.
Failure budgets belong to one story, so retries do not affect another example.

The large Facilities source has 80 roots and 1,000 children under one parent.
Root and child requests each return at most 25 siblings. The initial payload
contains `hasChildren` and `childrenCount`; it does not embed descendants. All
and Lending both start collapsed, and explicit expansion requests children.
Large sample datasets verify functional paging, not production throughput or
virtualization.

Generic table stories use a small synthetic service adapter, with controlled
pagination, sorting, filters and query text stored in the story's in-memory URL.
Only the requested page is passed to GenericDataTable. The wrapper composes the
same shared filters, toolbar, actions and column-settings dialog as a real owner.

Portal/dialog examples have separate documentation iframes so their overlays do
not take over other documentation examples. For cross-page navigation, browser
history and application layout, verify the real route as well.

## Validation boundary

The Storybook Vite configuration is separate from the application's test
configuration and retains real `iwa-react-components` and `ing-react-icons`
imports. Full preview rendering, static build and browser tests therefore need
those dependencies. Do not use the repository's test doubles as a visual theme.

`npm test` includes portable-story smoke checks, provider isolation and async
scenario tests under the existing Vitest-only aliases. They do not establish
that the real design system passes visual or accessibility checks.

See [ADR 0051](adr/0051-storybook-for-table-components.md).

## Diagnosing failures after transferring code

If `getExpandableTreeKeys` returns no keys for a root with `hasChildren: true`
and `children: []`, check that `src/ui/TreeDataTable/treeKeys.ts` accepts and uses
the fourth `getHasChildren` argument, including recursive calls. Facilities
passes `facilityNodeHasChildren` in `FacilitiesView`. An older helper that checks
only the loaded array disables Expand all before it can request any descendants.
The pure helper and root-only owner tests cover this without fetching the tree.

Select tests must exercise the dropdown rather than assume native select markup.
Popover tests must retain the button ref when the positioning layer clones its
anchor. The local test adapters exercise both boundaries; the real IWA run is
still required. When transferring tests into another application, transfer their
helpers and component dependencies together and verify the same source revision.

TypeScript errors for missing props identify mismatched component revisions:

| Error                                                               | Source to transfer together                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loading` is missing from `FacilitiesViewProps`                     | `src/features/facilities/FacilitiesView.tsx`, including its props, defaults and render logic, alongside `src/dev/facilities/FacilitiesPreviewPage.tsx` |
| `allExpanded` is missing from `TableActionsProps`                   | `src/ui/TableActions.tsx`, including the owner-supplied completeness check                                                                             |
| `getHasChildren` or `onExpand` is missing from `TreeDataTableProps` | `src/ui/TreeDataTable/TreeDataTable.tsx`, its `index.ts` and `treeKeys.ts`; `TreeDataTable.types.ts` forwards the component's contract                 |

Pending tree rendering also uses `getChildrenLoading`, `loadingMore` and the
shared `TableCellSkeleton`. Transfer its feature row accessor and the UI exports
with the implementation. Annotating callback parameters does not restore missing
props or their runtime behavior; update the component contract and implementation
together.

The tree adapter declares its public props in its implementation file, and the
legacy types module only re-exports them. Facilities derives `loading` and
`loadingMore` from that contract and supplies an explicit `FacilityTableRow`
generic/callback type. TableActions applies its optional `allExpanded` default
directly to the switch's checked value and change handler.

The real IWA `InlineLink.label` accepts a string. `UnderlinedTextCell` validates
primitive values before converting its label with `String(value)`; its unavailable
fallback may remain a React node. Passing the general `renderCellValue` return
type as a label is too broad even when the current value renders as text.
