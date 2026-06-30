import { describe, expect, it } from 'vitest';
import {
  defaultListQuery,
  parseListQuery,
  serializeListQuery,
  type ListQuery,
} from './urlState.schema';

describe('listQuery schema', () => {
  it('falls back to defaults for an empty URL', () => {
    expect(parseListQuery(new URLSearchParams())).toEqual(defaultListQuery);
  });

  it('coerces and validates raw params', () => {
    const params = new URLSearchParams('q=abc&page=3&pageSize=100&sort=name&dir=asc');
    expect(parseListQuery(params)).toEqual({
      q: 'abc',
      sort: 'name',
      dir: 'asc',
      page: 3,
      pageSize: 100,
    });
  });

  it('falls back per-field on malformed values', () => {
    const query = parseListQuery(new URLSearchParams('page=0&pageSize=9999&dir=sideways'));
    expect(query.page).toBe(defaultListQuery.page); // min 1
    expect(query.pageSize).toBe(defaultListQuery.pageSize); // out of range
    expect(query.dir).toBe(defaultListQuery.dir); // invalid enum
  });

  it('omits defaults when serializing (short URLs)', () => {
    const query: ListQuery = { ...defaultListQuery, q: 'hello', page: 2 };
    expect(serializeListQuery(query)).toEqual({ q: 'hello', page: '2' });
  });

  it('round-trips a non-default query', () => {
    const query: ListQuery = { q: 'x', sort: 'name', dir: 'desc', page: 4, pageSize: 25 };
    expect(parseListQuery(new URLSearchParams(serializeListQuery(query)))).toEqual(query);
  });
});
