import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { parseStoredTableSettings } from './tableSettings.schema';
import type { TableSettingsState } from './tableSettings.types';

/** Build the slice state from a stored payload before the first render. */
export function createTableSettingsState(raw?: unknown): TableSettingsState {
  return parseStoredTableSettings(raw);
}

/**
 * User preferences for generic tables, keyed by `GenericDataTableConfig.id`.
 * A table without an entry renders its configured fields; an entry holds the
 * chosen field names in display order.
 */
const tableSettingsSlice = createSlice({
  name: 'tableSettings',
  initialState: createTableSettingsState(),
  reducers: {
    tableColumnsSaved(
      state,
      action: PayloadAction<{ tableId: string; columns: readonly string[] }>,
    ) {
      state.tables[action.payload.tableId] = { columns: [...action.payload.columns] };
    },
    tableSettingsRestored(state, action: PayloadAction<{ tableId: string }>) {
      delete state.tables[action.payload.tableId];
    },
  },
});

export const { tableColumnsSaved, tableSettingsRestored } = tableSettingsSlice.actions;
export const tableSettingsReducer = tableSettingsSlice.reducer;
