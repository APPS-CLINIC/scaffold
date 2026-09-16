import type { RootState } from '@/app/store';

export const selectTableSettings = (state: RootState) => state.tableSettings;

/** The stored column names of one table, or `undefined` when the user never customized it. */
export const selectStoredTableColumns = (
  state: RootState,
  tableId: string,
): readonly string[] | undefined => state.tableSettings.tables[tableId]?.columns;
