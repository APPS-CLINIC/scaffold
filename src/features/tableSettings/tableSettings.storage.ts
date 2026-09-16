import { serializeTableSettings } from './tableSettings.schema';
import type { TableSettingsState } from './tableSettings.types';

/**
 * Where table settings are kept between sessions. `read` hands back whatever
 * is stored, unparsed, and never throws; `write` replaces the stored settings
 * and swallows storage failures, so the in-memory state still applies.
 */
export interface TableSettingsStorage {
  read(): unknown;
  write(state: TableSettingsState): void;
}

export const TABLE_SETTINGS_STORAGE_KEY = 'scaffold.tableSettings';

export function createLocalStorageTableSettingsStorage(storage?: Storage): TableSettingsStorage {
  const resolveStorage = () => storage ?? window.localStorage;

  return {
    read() {
      try {
        const raw = resolveStorage().getItem(TABLE_SETTINGS_STORAGE_KEY);
        return raw === null ? undefined : JSON.parse(raw);
      } catch {
        return undefined;
      }
    },
    write(state) {
      try {
        if (Object.keys(state.tables).length === 0) {
          resolveStorage().removeItem(TABLE_SETTINGS_STORAGE_KEY);
        } else {
          resolveStorage().setItem(
            TABLE_SETTINGS_STORAGE_KEY,
            JSON.stringify(serializeTableSettings(state)),
          );
        }
      } catch {
        // Storage can be disabled or full; the settings still apply for this session.
      }
    },
  };
}
