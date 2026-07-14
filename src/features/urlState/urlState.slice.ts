import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { defaultNavTabKey, type NavTabKey } from '@/routes/navTabs';
import { defaultListQuery, type ListQuery } from './urlState.schema';

/**
 * Read-only mirror of URL-derived state inside Redux.
 *
 * Why mirror the URL into the store at all? So that reselect selectors can
 * combine URL state with server cache / UI state, and listener middleware can
 * react to URL changes (e.g. prefetch).
 *
 * Writes never happen here directly — the URL is the source of truth. The
 * `UrlStateSync` component dispatches `listQueryChanged` whenever the URL
 * changes, keeping this mirror in sync one-directionally (URL -> store).
 */
export interface UrlState {
  list: ListQuery;
  /** Top-bar tab derived from the pathname (see `parseActiveTab`). */
  activeTab: NavTabKey;
}

const initialState: UrlState = {
  list: defaultListQuery,
  activeTab: defaultNavTabKey,
};

const urlStateSlice = createSlice({
  name: 'urlState',
  initialState,
  reducers: {
    listQueryChanged(state, action: PayloadAction<ListQuery>) {
      state.list = action.payload;
    },
    activeTabChanged(state, action: PayloadAction<NavTabKey>) {
      state.activeTab = action.payload;
    },
  },
});

export const { listQueryChanged, activeTabChanged } = urlStateSlice.actions;
export const urlStateReducer = urlStateSlice.reducer;
