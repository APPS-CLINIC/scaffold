import { describe, expect, it } from 'vitest';
import {
  defaultItemsQuery,
  parseItemsQuery,
  serializeItemsQuery,
  type ItemsQuery,
} from './urlState.schema';

describe('itemsQuery schema', () => {
  it('falls back to defaults for an empty URL', () => {
    expect(parseItemsQuery(new URLSearchParams())).toEqual(defaultItemsQuery);
  });

  it('coerces and validates raw params', () => {
    const params = new URLSearchParams('q=abc&status=active&page=3&pageSize=100&sort=name&dir=asc');
    expect(parseItemsQuery(params)).toEqual({
      q: 'abc',
      status: 'active',
      sort: 'name',
      dir: 'asc',
      page: 3,
      pageSize: 100,
    } satisfies ItemsQuery);
  });

  it('never throws on malformed input — it catches to defaults', () => {
    const params = new URLSearchParams('status=bogus&page=-5&pageSize=99999&dir=sideways');
    const parsed = parseItemsQuery(params);
    expect(parsed.status).toBe(defaultItemsQuery.status);
    expect(parsed.page).toBe(defaultItemsQuery.page);
    expect(parsed.pageSize).toBe(defaultItemsQuery.pageSize);
    expect(parsed.dir).toBe(defaultItemsQuery.dir);
  });

  it('omits default values when serializing to keep URLs short', () => {
    const serialized = serializeItemsQuery({ ...defaultItemsQuery, q: 'hello', page: 2 });
    expect(serialized).toEqual({ q: 'hello', page: '2' });
  });

  it('round-trips a non-default query', () => {
    const query: ItemsQuery = {
      q: 'widget',
      status: 'inactive',
      sort: 'value',
      dir: 'asc',
      page: 4,
      pageSize: 25,
    };
    const roundTripped = parseItemsQuery(new URLSearchParams(serializeItemsQuery(query)));
    expect(roundTripped).toEqual(query);
  });
});
