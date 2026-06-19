import { createSelector } from '@reduxjs/toolkit';
import { selectItemsQuery } from '@/features/urlState/urlState.selectors';

/**
 * Example of a reselect selector that derives a view-model value from URL
 * state. Components subscribe to this instead of recomputing on every render.
 */
export const selectPageWindow = createSelector([selectItemsQuery], (query) => {
  const from = (query.page - 1) * query.pageSize;
  return { from, to: from + query.pageSize };
});
