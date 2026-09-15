import { describe, expect, it } from 'vitest';
import {
  createTableSettingsState,
  tableColumnsSaved,
  tableSettingsReducer,
  tableSettingsRestored,
} from './tableSettings.slice';

describe('createTableSettingsState', () => {
  it('starts empty without a stored payload', () => {
    expect(createTableSettingsState()).toEqual({ tables: {} });
    expect(createTableSettingsState(undefined)).toEqual({ tables: {} });
  });

  it('parses a stored payload totally', () => {
    expect(
      createTableSettingsState({
        version: 1,
        tables: { customers: { columns: ['grid', 'fullName'] }, broken: { columns: [] } },
      }),
    ).toEqual({ tables: { customers: { columns: ['grid', 'fullName'] } } });
    expect(createTableSettingsState('not json')).toEqual({ tables: {} });
  });
});

describe('tableSettings reducer', () => {
  it('starts from empty settings', () => {
    expect(tableSettingsReducer(undefined, { type: 'init' })).toEqual({ tables: {} });
  });

  it('stores a copy of the saved columns under the table id', () => {
    const columns = ['grid', 'fullName'];

    const state = tableSettingsReducer(
      undefined,
      tableColumnsSaved({ tableId: 'customers', columns }),
    );

    expect(state.tables.customers?.columns).toEqual(['grid', 'fullName']);
    expect(state.tables.customers?.columns).not.toBe(columns);
    columns.push('status');
    expect(state.tables.customers?.columns).toEqual(['grid', 'fullName']);
    expect(tableColumnsSaved.type).toBe('tableSettings/tableColumnsSaved');
  });

  it('replaces an existing entry and leaves other tables alone', () => {
    const seeded = tableSettingsReducer(
      tableSettingsReducer(undefined, tableColumnsSaved({ tableId: 'orders', columns: ['id'] })),
      tableColumnsSaved({ tableId: 'customers', columns: ['grid'] }),
    );

    const state = tableSettingsReducer(
      seeded,
      tableColumnsSaved({ tableId: 'customers', columns: ['fullName', 'status'] }),
    );

    expect(state.tables).toEqual({
      orders: { columns: ['id'] },
      customers: { columns: ['fullName', 'status'] },
    });
    expect(state.tables.orders).toBe(seeded.tables.orders);
  });

  it('deletes the entry on restore', () => {
    const seeded = tableSettingsReducer(
      tableSettingsReducer(undefined, tableColumnsSaved({ tableId: 'orders', columns: ['id'] })),
      tableColumnsSaved({ tableId: 'customers', columns: ['grid'] }),
    );

    const state = tableSettingsReducer(seeded, tableSettingsRestored({ tableId: 'customers' }));

    expect(state.tables).toEqual({ orders: { columns: ['id'] } });
    expect(tableSettingsRestored.type).toBe('tableSettings/tableSettingsRestored');
  });

  it('keeps the state reference when restoring a table that has no entry', () => {
    const state = tableSettingsReducer(undefined, { type: 'init' });

    expect(tableSettingsReducer(state, tableSettingsRestored({ tableId: 'customers' }))).toBe(
      state,
    );
  });
});
