import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { navigationManifest } from '@/routes/navigation';
import { defaultListQuery } from './urlState.schema';

/** Base selector: the validated list query mirrored from the URL. */
export const selectListQuery = (state: RootState) => state.urlState.list;

/** Complete serializable route identity mirrored from the pathname. */
export const selectRoute = (state: RootState) => state.urlState.route;

/** Active top-bar tab derived from the canonical route mirror. */
export const selectActiveTab = createSelector([selectRoute], (route) => route.sectionKey);

export const selectActiveNavigationItemId = createSelector([selectRoute], (route) => route.itemId);

export const selectPathname = createSelector([selectRoute], (route) => route.pathname);

/** The active tab as a TabMenu index within the manifest sections. */
export const selectActiveTabIndex = createSelector([selectActiveTab], (activeTab) =>
  navigationManifest.sections.findIndex((section) => section.id === activeTab),
);

/**
 * Memoized derived selectors (reselect). They only recompute when their inputs
 * change, and return stable references so consuming components don't re-render
 * needlessly — important for large-data screens.
 */
export const selectListSortDescriptor = createSelector([selectListQuery], (query) => ({
  field: query.sort,
  direction: query.dir,
}));

export const selectListIsFiltered = createSelector(
  [selectListQuery],
  (query) => query.q !== defaultListQuery.q || Object.keys(query.filters).length > 0,
);
