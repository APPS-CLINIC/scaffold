# Replies to review comments — Facilities PoC

## Emil — PR description

You're right, it was too long and it got cut. I replaced it with a short summary.

## Emil — `FacilitiesPreviewPage.tsx`: move the logic into a hook

Done. The page now uses `useFacilitiesPreview()`. It returns the data, the loading and error
state and the handlers (`loadChildren`, `loadMoreRoots`, `expandToLevel`). The page only
handles the URL, the dialog and the rendering.

## Emil — `FacilitiesPreviewPage.tsx`: share the query key with `FacilitiesView`

Done. Both now use `facilityQueryKey(q, filters)`. It removes the display currency in one
place and works with raw URL filters and with parsed filters. I added tests for it.

## Emil — `FacilitiesView.tsx`: `useFacilityTreeExpansion`

Done. The new hook keeps the selected and loading level, cancels a running load, loads pages
through `onExpandToLevel` and goes back to the previous level after an error. The view only
renders. I added tests for the hook, also for the error case, which had no test before.

## Emil — `FacilitiesPreviewPage.tsx`: inline `getFacilityHref` and `onOpenRelated`

Yes, Copilot was right here. The view builds the table config in `useMemo` with these two
functions as dependencies, so new functions on every render rebuilt the config. Both are now
`useCallback`.

## Anna — `facilitiesPreview.path.ts`: is it used? / nginx

You were right, the comment was wrong. The page was missing on the environment because the
route was added only in dev mode (`import.meta.env.DEV`), and the environment runs a
production build. nginx was not the problem. I removed the comment and moved the page to
`/facilities`. It now works in every build until the backend is ready (ADR 0058). The
constant is still used by the page for the facility links and for closing the dialog.

## Anna — `facilities.formatters.ts`: return without the `result` variable

Good point, I'll return the `reduce` result directly.

## Anna — `facilitiesPreview.api.ts`: constants for the states (two comments)

Agreed. I'll keep the state names (`unloaded`, `loading`, `loaded`, `error`) in one place and
build the types from it.

## Anna — `TableActions.tsx`: `customers.actions.expandAll` / `customers.actions.export`

Right, these are not about customers. I'll rename them to `table.actions.expandAll` and
`table.actions.export`.

## Anna — `TreeDataTable.types.ts`: define the types in this file

Yes, I'll move the props types into this file and import them in the component.

## Anna — `FacilityTableCells.tsx`: fields here and in `facilityTable.config.tsx`

They have different jobs. `facilityTable.config.tsx` defines the columns and the filters (type,
commitment and contract currency are filters there). `FacilityTableCells.tsx` only draws the
"Basic data" column, which shows several values in one cell. So the names are in both files,
but nothing is defined twice. I'll add a short comment in the cells file to make this clear.
