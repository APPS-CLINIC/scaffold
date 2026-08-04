import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { defaultUrlRouteState, type UrlRouteState } from './urlState.route';
import { defaultListQuery, type ListQuery } from './urlState.schema';

/**
 * Read-only mirror of URL-derived state inside Redux.
 *
 * Why mirror the URL into the store at all? So that reselect selectors can
 * combine URL state with server cache / UI state, and listener middleware can
 * react to URL changes (e.g. prefetch).
 *
 * Writes never happen here directly — the URL is the source of truth. The
 * `UrlStateSync` dispatches `routeChanged` for every distinct pathname and
 * `listQueryChanged` for validated query changes, keeping this mirror in sync
 * one-directionally (URL -> store).
 */
export interface UrlState {
  list: ListQuery;
  route: UrlRouteState;
}

const initialState: UrlState = {
  list: defaultListQuery,
  route: defaultUrlRouteState,
};

const urlStateSlice = createSlice({
  name: 'urlState',
  initialState,
  reducers: {
    listQueryChanged(state, action: PayloadAction<ListQuery>) {
      state.list = action.payload;
    },
    routeChanged(state, action: PayloadAction<UrlRouteState>) {
      state.route = action.payload;
    },
  },
});

export const { listQueryChanged, routeChanged } = urlStateSlice.actions;
export const urlStateReducer = urlStateSlice.reducer;
