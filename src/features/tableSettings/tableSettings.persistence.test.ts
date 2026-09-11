import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { routeChanged } from '@/features/urlState/urlState.slice';
import { startTableSettingsPersistence } from './tableSettings.persistence';
import { tableColumnsSaved, tableSettingsRestored } from './tableSettings.slice';
import type { TableSettingsStorage } from './tableSettings.storage';

function createStorageSpy(): TableSettingsStorage {
  return { read: vi.fn(() => undefined), write: vi.fn() };
}

describe('startTableSettingsPersistence', () => {
  // The listener middleware is a module singleton, so every registration must
  // be removed before the next test builds its store.
  let stop: (() => void) | undefined;
  afterEach(() => {
    stop?.();
    stop = undefined;
  });

  it('writes the whole slice once after a save and after a restore', () => {
    const storage = createStorageSpy();
    stop = startTableSettingsPersistence(storage);
    const store = makeStore({ tableSettings: { tables: { orders: { columns: ['id'] } } } });

    store.dispatch(tableColumnsSaved({ tableId: 'customers', columns: ['grid', 'fullName'] }));

    expect(storage.write).toHaveBeenCalledTimes(1);
    expect(storage.write).toHaveBeenLastCalledWith({
      tables: { orders: { columns: ['id'] }, customers: { columns: ['grid', 'fullName'] } },
    });

    store.dispatch(tableSettingsRestored({ tableId: 'orders' }));

    expect(storage.write).toHaveBeenCalledTimes(2);
    expect(storage.write).toHaveBeenLastCalledWith({
      tables: { customers: { columns: ['grid', 'fullName'] } },
    });
  });

  it('writes nothing on store creation or for unrelated actions', () => {
    const storage = createStorageSpy();
    stop = startTableSettingsPersistence(storage);
    const store = makeStore({ tableSettings: { tables: { customers: { columns: ['grid'] } } } });

    store.dispatch(
      routeChanged({
        pathname: '/customers/all',
        sectionKey: 'customers',
        itemId: 'all-customers',
      }),
    );
    store.dispatch({ type: 'tableSettings/somethingElse' });

    expect(storage.write).not.toHaveBeenCalled();
    expect(storage.read).not.toHaveBeenCalled();
  });

  it('stops writing once unsubscribed', () => {
    const storage = createStorageSpy();
    stop = startTableSettingsPersistence(storage);
    const store = makeStore();

    store.dispatch(tableColumnsSaved({ tableId: 'customers', columns: ['grid'] }));
    expect(storage.write).toHaveBeenCalledTimes(1);

    stop();
    stop = undefined;
    store.dispatch(tableColumnsSaved({ tableId: 'customers', columns: ['fullName'] }));
    store.dispatch(tableSettingsRestored({ tableId: 'customers' }));

    expect(storage.write).toHaveBeenCalledTimes(1);
  });

  it('leaves a store without a registration writer-free', () => {
    const storage = createStorageSpy();
    const store = makeStore();

    store.dispatch(tableColumnsSaved({ tableId: 'customers', columns: ['grid'] }));

    expect(storage.write).not.toHaveBeenCalled();
    expect(store.getState().tableSettings.tables.customers?.columns).toEqual(['grid']);
  });
});
