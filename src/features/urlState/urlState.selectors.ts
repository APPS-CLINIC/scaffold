import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { defaultListQuery } from './urlState.schema';

/** Base selector: the validated list query mirrored from the URL. */
export const selectListQuery = (state: RootState) => state.urlState.list;

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
  (query) => query.q !== defaultListQuery.q,
);
