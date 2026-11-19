# Replies to review comments — Facilities PoC

Each section is one comment thread in the Azure PR: the file, the comment, then the
reply to paste. Reviewers are named by role only.

| #   | Who        | File                                                  | Status                                             |
| --- | ---------- | ----------------------------------------------------- | -------------------------------------------------- |
| 1   | Reviewer 1 | PR description                                        | Done (paste the new description into the Azure PR) |
| 2   | Reviewer 1 | `FacilitiesPreviewPage.tsx` — move logic into a hook  | Done                                               |
| 3   | Reviewer 1 | `FacilitiesPreviewPage.tsx` — shared query key        | Done                                               |
| 4   | Reviewer 1 | `FacilitiesView.tsx` — `useFacilityTreeExpansion`     | Done                                               |
| 5   | Reviewer 1 | `FacilitiesPreviewPage.tsx` — `useCallback`           | Done                                               |
| 6   | Reviewer 1 | `useFacilitiesPreview.ts` — one page per ancestor     | Done                                               |
| 7   | Reviewer 1 | `FacilitiesPreviewPage.test.tsx` — long tests         | Done                                               |
| 8   | Reviewer 2 | `facilitiesPreview.path.ts` — is it used? / nginx     | Done                                               |
| 9   | Reviewer 2 | `facilities.formatters.ts` — return directly          | Done                                               |
| 10  | Reviewer 2 | `facilitiesPreview.api.ts` — constants (two comments) | Done                                               |
| 11  | Reviewer 2 | `TableActions.tsx` — `customers.actions.*` keys       | Done                                               |
| 12  | Reviewer 2 | `TreeDataTable.types.ts` — define the types here      | Done                                               |
| 13  | Reviewer 2 | `FacilityTableCells.tsx` — fields here and in config  | Done                                               |
| 14  | Reviewer 2 | `facilityGroupLabels.ts` — dictionaries from backend  | Already answered and resolved                      |

## 1. Reviewer 1 — PR description

> PR description was cut down (stops mid sentence). What was ommited? 😅
> This description is too long to be readable in my opinion. If you think LLM-generated
> output is enough ask for a concise description. I would prefer a human-made summary
> though.

**Reply:**

You're right, it was too long and it got cut. I replaced it with a short summary.

## 2. Reviewer 1 — `FacilitiesPreviewPage.tsx` (`expandToLevel`)

> This page combines rendering with query construction, data fetching, tree pagination,
> and expansion behavior, which makes the component dense and difficult to follow without
> external explanation.
>
> Could we move the preview query/tree-loading logic into a focused hook and keep the page
> primarily presentational? For example, `useFacilitiesPreview()` hook could return a big
> DTO with data, loading/error state, and handlers such as `loadChildren` and
> `expandToLevel`.

**Reply:**

Done. The page now uses `useFacilitiesPreview()`. It returns the data, the loading and error
state and the handlers (`loadChildren`, `loadMoreRoots`, `expandToLevel`). The page only
handles the URL, the dialog and the rendering.

## 3. Reviewer 1 — `FacilitiesPreviewPage.tsx` (`requestKey`)

> Could we share this query-key logic with FacilitiesView (by adding some util)? The page
> builds a key from raw URL filters, while the view builds one from parsed filters and
> separately excludes display currency.

**Reply:**

Done. Both now use `facilityQueryKey(q, filters)`. It removes the display currency in one
place and works with raw URL filters and with parsed filters. I added tests for it.

## 4. Reviewer 1 — `FacilitiesView.tsx` (`expansionRequest`)

> Could we move the level-expansion behavior into a focused hook, such as
> `useFacilityTreeExpansion`? The hook would own the selected/loading levels, request
> cancellation, loading branches through `onExpandToLevel`, and restoring the previous
> level after failure; the view would call its returned handlers and render the resulting
> state.
>
> This follows the React convention of extracting reusable or cohesive stateful behavior
> into custom hooks, while keeping the component focused on rendering.

**Reply:**

Done. The new hook keeps the selected and loading level, cancels a running load, loads pages
through `onExpandToLevel` and goes back to the previous level after an error. The view only
renders. I added tests for the hook, also for the error case, which had no test before.

## 5. Reviewer 1 — `FacilitiesPreviewPage.tsx` (`getFacilityHref`, `onOpenRelated`)

> Copilot says that since `getFacilityHref` and `onOpenRelated` are created inline in the
> `<FacilitiesView>` props, they get recreated on each page render. That causes the table
> config to be rebuilt and can remount its cells.
> Maybe w should wrap them in `useCallback` and pass the callbacks by name?

**Reply:**

Yes, Copilot was right here. The view builds the table config in `useMemo` with these two
functions as dependencies, so new functions on every render rebuilt the config. Both are now
`useCallback`.

## 6. Reviewer 1 — `useFacilitiesPreview.ts` (`await loadChildren(key)`)

> This loads only one page of children per ancestor. Is that intentional? Searching for
> F-100 leaves the matching F-1007 hidden behind "Load more children."
>
> (with a test: `?q=F-100` should show F-1004 and, from the next page, F-1007)

**Reply:**

No, it was not intentional for this case. I knew about this limit, but your example shows
it is a bug: the search result has only matches and their parents, so every child page of a
revealed branch is needed. Now the hook loads all child pages of each revealed branch
(`loadAllChildren`), the same way "Expand all" does. A new query also aborts the request in
progress. I added your test (`?q=F-100` shows F-1004 and F-1007, and there is no "Load more
children" button). For a large real result this means many page requests, so we will need a
limit when we connect the backend.

## 7. Reviewer 1 — `FacilitiesPreviewPage.test.tsx` (long tests)

> Could we make the longer tests easier to follow by separating the scenarios and adding
> short comments around the main steps? There are many interactions and timer advances in
> sequence, so it's difficult to see what each section is proving.
>
> (with an example split into: load the first child page of F-1003 / load the next page /
> collapse and reopen the branch)

**Reply:**

Done. I split the long test into three scenarios: loading only the direct children, loading
the next child page, and reusing loaded children after collapse and after a currency change.
I added small helpers (`expandFacility`, `rowOf`, `requestIds`) and short comments before the
main steps, also in the other long tests.

## 8. Reviewer 2 — `facilitiesPreview.path.ts` (`FACILITIES_PREVIEW_PATH`)

> **Reviewer 2:** is it used? In dev it's not shown under: `<env>/customers/all/dev-facilities`
>
> **Reviewer 2:** Also in nginx.conf there is no mention about customer, so I'm not sure if the
> diagnostic from this comment is right
>
> **Author:** On my local environment works as expected, I didn't verify whether the changes
> were deployed correctly
>
> **Reviewer 2:** Imo either we should make it working on env or delete this comment, becuase as
> far as I understand it's not correct

**Reply:**

You were right, the comment was wrong. The page was missing on the environment because the
route was added only in dev mode (`import.meta.env.DEV`), and the environment runs a
production build. nginx was not the problem. I removed the comment and moved the page to
`/facilities`. It now works in every build until the backend is ready. The constant is still
used by the page for the facility links and for closing the dialog.

## 9. Reviewer 2 — `facilities.formatters.ts` (`const result = summaries.reduce(`)

> **Reviewer 2:** you can immediately return, without using result variable
>
> **Reviewer 2:** it's not changed

**Reply:**

Sorry, you're right, I missed it. Now the function returns the `reduce` result directly. I
also replaced `as FacilityAmounts` with `reduce<FacilityAmounts>`, so the start value is
type-checked instead of cast.

## 10. Reviewer 2 — `facilitiesPreview.api.ts` (two comments)

On `rootPageState: 'loaded' | 'loading' | 'error';` and on
`childrenState: node.hasChildren ? 'unloaded' : 'loaded',`:

> **Reviewer 2:** maybe constants could be used here
>
> **Reviewer 2 (on `rootPageState`):** I see like, but it's not changed. Is it fixed or are you going
> to use plain strings intentionally?
>
> **Reviewer 2 (on `childrenState`):** same here - unloaded and loaded is still string. Is it
> intentional?

**Reply (same for both):**

Not intentional, sorry, it was not pushed yet. It's fixed now. The state names are in one place,
`FACILITY_LOAD_STATE` in `facilities.types.ts`, and the type `FacilityLoadState` is built from
it. `childrenState` uses this type, and `rootPageState` uses it without `unloaded`. All places
in the Facilities code use the constant now (API, page, view, cells, filters), not plain
strings.

## 11. Reviewer 2 — `TableActions.tsx` (`t('customers.actions.expandAll')`)

> **Reviewer 2:** minor: it's not related to the customer, maybe table.actions.expandAll. The same
> for customers.actions.export
>
> **Reviewer 2:** not changed

**Reply:**

Sorry, fixed now. The keys are `table.actions.expandAll` and `table.actions.export` in `pl` and
`en`, and `TableActions.tsx` uses them.

## 12. Reviewer 2 — `TreeDataTable.types.ts`

> Should types be defined in this file? It will make TreeDataTable smaller and more focused
> on the logic

**Reply:**

Done. `TreeDataTableProps` and `TreeDataTableLabels` are now defined in
`TreeDataTable.types.ts`. The component and `index.ts` import them from there.

## 13. Reviewer 2 — `FacilityTableCells.tsx`

> why some fields are defined here and some are defined in facilityTable.config.tsx? Some
> are defined in both like commitment or contractCurrency

**Reply:**

They have different jobs. `facilityTable.config.tsx` defines the columns and the filters (type,
commitment and contract currency are filters there). `FacilityTableCells.tsx` only draws the
"Basic data" column, which shows several values in one cell. So the names are in both files,
but nothing is defined twice. I added a short comment above `FacilityBasicCell` to make
this clear.

## 14. Reviewer 2 — `facilityGroupLabels.ts` (already resolved)

> I guess this will be moved to dictionaries and fetched from the BE in the future, correct?

**Reply (already sent):** yes
