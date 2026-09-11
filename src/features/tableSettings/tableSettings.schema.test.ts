import { describe, expect, it } from 'vitest';
import {
  TABLE_SETTINGS_VERSION,
  parseStoredTableSettings,
  serializeTableSettings,
} from './tableSettings.schema';

const empty = { tables: {} };

describe('parseStoredTableSettings', () => {
  it('reads a valid payload', () => {
    expect(
      parseStoredTableSettings({
        version: 1,
        tables: {
          customers: { columns: ['fullName', 'grid'] },
          orders: { columns: ['id'] },
        },
      }),
    ).toEqual({
      tables: {
        customers: { columns: ['fullName', 'grid'] },
        orders: { columns: ['id'] },
      },
    });
  });

  it('drops the whole payload on a different version', () => {
    expect(
      parseStoredTableSettings({ version: 2, tables: { customers: { columns: ['fullName'] } } }),
    ).toEqual(empty);
    expect(
      parseStoredTableSettings({ version: '1', tables: { customers: { columns: ['fullName'] } } }),
    ).toEqual(empty);
    expect(parseStoredTableSettings({ tables: { customers: { columns: ['fullName'] } } })).toEqual(
      empty,
    );
  });

  it('yields empty settings for anything that is not an envelope', () => {
    expect(parseStoredTableSettings(undefined)).toEqual(empty);
    expect(parseStoredTableSettings(null)).toEqual(empty);
    expect(parseStoredTableSettings('not json')).toEqual(empty);
    expect(parseStoredTableSettings(42)).toEqual(empty);
    expect(parseStoredTableSettings({ version: 1 })).toEqual(empty);
    expect(parseStoredTableSettings({ version: 1, tables: [] })).toEqual(empty);
    expect(parseStoredTableSettings({ version: 1, tables: 'customers' })).toEqual(empty);
  });

  it('drops one bad entry and keeps the others', () => {
    expect(
      parseStoredTableSettings({
        version: 1,
        tables: {
          customers: { columns: [] },
          orders: { columns: ['id'] },
          invoices: { columns: 'id' },
          payments: null,
          contracts: { columns: ['id', 7] },
          reviews: {},
        },
      }),
    ).toEqual({ tables: { orders: { columns: ['id'] } } });
  });

  it('keeps only the columns of an entry', () => {
    expect(
      parseStoredTableSettings({
        version: 1,
        tables: { customers: { columns: ['fullName'], extra: true } },
      }),
    ).toEqual({ tables: { customers: { columns: ['fullName'] } } });
  });

  it('enforces the bounds per entry', () => {
    const longName = 'x'.repeat(65);
    const tooMany = Array.from({ length: 201 }, (_, index) => `field${index}`);
    const atTheLimit = Array.from({ length: 200 }, (_, index) => `field${index}`);

    expect(
      parseStoredTableSettings({
        version: 1,
        tables: {
          customers: { columns: ['fullName', longName] },
          orders: { columns: ['id', ''] },
          invoices: { columns: tooMany },
          payments: { columns: atTheLimit },
          ['t'.repeat(65)]: { columns: ['id'] },
        },
      }),
    ).toEqual({ tables: { payments: { columns: atTheLimit } } });
  });

  it('accepts any table id within the length bounds', () => {
    const tables = {
      Orders: { columns: ['id'] },
      'customer.orders': { columns: ['id'] },
      '2024report': { columns: ['id'] },
      ['t'.repeat(64)]: { columns: ['id'] },
    };

    expect(parseStoredTableSettings({ version: 1, tables })).toEqual({ tables });
  });

  it('never lets a stored __proto__ key reach the result', () => {
    const parsed = parseStoredTableSettings(
      JSON.parse(
        '{"version":1,"tables":{"customers":{"columns":["id"]},"__proto__":{"columns":["id"]}}}',
      ),
    );

    expect(parsed).toEqual({ tables: { customers: { columns: ['id'] } } });
    expect(Object.getPrototypeOf(parsed.tables)).toBe(Object.prototype);
    expect(Object.hasOwn(parsed.tables, '__proto__')).toBe(false);
  });
});

describe('serializeTableSettings', () => {
  it('wraps the tables in the current version envelope', () => {
    const state = { tables: { customers: { columns: ['fullName', 'grid'] } } };

    expect(serializeTableSettings(state)).toEqual({
      version: TABLE_SETTINGS_VERSION,
      tables: { customers: { columns: ['fullName', 'grid'] } },
    });
    expect(serializeTableSettings(state).version).toBe(1);
  });

  it('round-trips through parsing', () => {
    const state = { tables: { customers: { columns: ['grid', 'fullName'] } } };

    expect(
      parseStoredTableSettings(JSON.parse(JSON.stringify(serializeTableSettings(state)))),
    ).toEqual(state);
  });
});
