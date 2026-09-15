import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  TABLE_SETTINGS_STORAGE_KEY,
  createLocalStorageTableSettingsStorage,
} from './tableSettings.storage';

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(initial));

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}

const payload = { version: 1, tables: { customers: { columns: ['fullName', 'grid'] } } };

describe('createLocalStorageTableSettingsStorage', () => {
  afterEach(() => window.localStorage.clear());

  describe('read', () => {
    it('returns undefined when nothing is stored', () => {
      expect(createLocalStorageTableSettingsStorage(createMemoryStorage()).read()).toBeUndefined();
    });

    it('returns the stored payload parsed, without validating it', () => {
      const storage = createMemoryStorage({
        [TABLE_SETTINGS_STORAGE_KEY]: JSON.stringify({ version: 99, anything: true }),
      });

      expect(createLocalStorageTableSettingsStorage(storage).read()).toEqual({
        version: 99,
        anything: true,
      });
    });

    it('returns undefined for invalid JSON', () => {
      const storage = createMemoryStorage({ [TABLE_SETTINGS_STORAGE_KEY]: 'not json' });

      expect(createLocalStorageTableSettingsStorage(storage).read()).toBeUndefined();
    });

    it('returns undefined when the storage throws', () => {
      const storage = createMemoryStorage();
      vi.spyOn(storage, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(createLocalStorageTableSettingsStorage(storage).read()).toBeUndefined();
    });

    it('never writes', () => {
      const storage = createMemoryStorage({ [TABLE_SETTINGS_STORAGE_KEY]: 'not json' });
      const setItem = vi.spyOn(storage, 'setItem');
      const removeItem = vi.spyOn(storage, 'removeItem');

      createLocalStorageTableSettingsStorage(storage).read();

      expect(setItem).not.toHaveBeenCalled();
      expect(removeItem).not.toHaveBeenCalled();
      expect(storage.getItem(TABLE_SETTINGS_STORAGE_KEY)).toBe('not json');
    });
  });

  describe('write', () => {
    it('stores the settings inside the versioned envelope', () => {
      const storage = createMemoryStorage();

      createLocalStorageTableSettingsStorage(storage).write({
        tables: { customers: { columns: ['fullName', 'grid'] } },
      });

      expect(JSON.parse(storage.getItem(TABLE_SETTINGS_STORAGE_KEY) ?? '')).toEqual(payload);
    });

    it('removes the key when no table is customized', () => {
      const storage = createMemoryStorage({
        [TABLE_SETTINGS_STORAGE_KEY]: JSON.stringify(payload),
      });

      createLocalStorageTableSettingsStorage(storage).write({ tables: {} });

      expect(storage.getItem(TABLE_SETTINGS_STORAGE_KEY)).toBeNull();
      expect(storage.length).toBe(0);
    });

    it('swallows a failing write', () => {
      const storage = createMemoryStorage();
      vi.spyOn(storage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      vi.spyOn(storage, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const port = createLocalStorageTableSettingsStorage(storage);

      expect(() => port.write({ tables: { customers: { columns: ['fullName'] } } })).not.toThrow();
      expect(() => port.write({ tables: {} })).not.toThrow();
    });
  });

  it('uses the browser localStorage by default', () => {
    const port = createLocalStorageTableSettingsStorage();

    port.write({ tables: { customers: { columns: ['fullName'] } } });

    expect(JSON.parse(window.localStorage.getItem(TABLE_SETTINGS_STORAGE_KEY) ?? '')).toEqual({
      version: 1,
      tables: { customers: { columns: ['fullName'] } },
    });
    expect(port.read()).toEqual({ version: 1, tables: { customers: { columns: ['fullName'] } } });
  });
});
