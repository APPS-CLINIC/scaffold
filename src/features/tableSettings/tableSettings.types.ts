/** The user's chosen fields of one table, in display order; field names only. */
export interface TableColumnSettings {
  columns: string[];
}

export interface TableSettingsState {
  tables: Record<string, TableColumnSettings>;
}

/** The persisted envelope; `version` lets a later shape drop payloads it cannot read. */
export interface StoredTableSettings {
  version: 1;
  tables: Record<string, TableColumnSettings>;
}
