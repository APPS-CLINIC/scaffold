import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { defaultItemsQuery } from './urlState.schema';

/** Base selector: the validated items query mirrored from the URL. */
export const selectItemsQuery = (state: RootState) => state.urlState.items;

/**
 * Memoized derived selectors (reselect). They only recompute when their
 * inputs change, and return stable references so consuming components don't
 * re-render needlessly — important for large-data screens.
 */
export const selectItemsSortDescriptor = createSelector([selectItemsQuery], (query) => ({
  field: query.sort,
  direction: query.dir,
}));

export const selectItemsIsFiltered = createSelector(
  [selectItemsQuery],
  (query) => query.q !== defaultItemsQuery.q || query.status !== defaultItemsQuery.status,
);
