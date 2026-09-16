import { z } from 'zod';
import type {
  StoredTableSettings,
  TableColumnSettings,
  TableSettingsState,
} from './tableSettings.types';

export const TABLE_SETTINGS_VERSION = 1;

const tableIdSchema = z.string().min(1).max(64);

const tableColumnSettingsSchema = z.object({
  columns: z.array(z.string().min(1).max(64)).min(1).max(200),
});

const storedTableSettingsSchema = z.object({
  version: z.literal(TABLE_SETTINGS_VERSION),
  tables: z.record(z.string(), z.unknown()),
});

/**
 * Total parsing of a stored payload: anything that is not a current-version
 * envelope yields empty settings, and each table entry is validated on its own
 * so one corrupt entry never discards the others.
 */
export function parseStoredTableSettings(raw: unknown): TableSettingsState {
  const envelope = storedTableSettingsSchema.safeParse(raw);
  if (!envelope.success) return { tables: {} };

  const tables: Record<string, TableColumnSettings> = {};
  for (const [tableId, entry] of Object.entries(envelope.data.tables)) {
    const parsedId = tableIdSchema.safeParse(tableId);
    const parsedEntry = tableColumnSettingsSchema.safeParse(entry);
    if (parsedId.success && parsedEntry.success) {
      tables[parsedId.data] = parsedEntry.data;
    }
  }

  return { tables };
}

export function serializeTableSettings(state: TableSettingsState): StoredTableSettings {
  return { version: TABLE_SETTINGS_VERSION, tables: state.tables };
}
