import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { routeChanged } from '@/features/urlState/urlState.slice';
import { selectStoredTableColumns, selectTableSettings } from './tableSettings.selectors';
import { tableColumnsSaved, tableSettingsRestored } from './tableSettings.slice';

describe('tableSettings selectors', () => {
  it('reads the registered slice of a fresh store', () => {
    const store = makeStore();

    expect(selectTableSettings(store.getState())).toEqual({ tables: {} });
    expect(selectStoredTableColumns(store.getState(), 'customers')).toBeUndefined();
  });

  it('reads the preloaded settings before any dispatch', () => {
    const store = makeStore({
      tableSettings: { tables: { customers: { columns: ['grid', 'fullName'] } } },
    });

    expect(selectStoredTableColumns(store.getState(), 'customers')).toEqual(['grid', 'fullName']);
    expect(selectStoredTableColumns(store.getState(), 'orders')).toBeUndefined();
  });

  it('returns the same column reference until that table changes', () => {
    const store = makeStore();
    store.dispatch(tableColumnsSaved({ tableId: 'customers', columns: ['grid'] }));
    const columns = selectStoredTableColumns(store.getState(), 'customers');

    store.dispatch(
      routeChanged({
        pathname: '/customers/all',
        sectionKey: 'customers',
        itemId: 'all-customers',
      }),
    );
    store.dispatch(tableColumnsSaved({ tableId: 'orders', columns: ['id'] }));
    expect(selectStoredTableColumns(store.getState(), 'customers')).toBe(columns);

    store.dispatch(tableSettingsRestored({ tableId: 'customers' }));
    expect(selectStoredTableColumns(store.getState(), 'customers')).toBeUndefined();
  });
});
