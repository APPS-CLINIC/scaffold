import { createSearchParams } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  areListQueriesEqual,
  defaultListQuery,
  MAX_FILTER_VALUES,
  parseListQuery,
  serializeListQuery,
  type ListQuery,
} from './urlState.schema';

describe('listQuery schema', () => {
  it('falls back to defaults for an empty URL', () => {
    expect(parseListQuery(new URLSearchParams())).toEqual(defaultListQuery);
  });

  it('coerces and validates raw params', () => {
    const params = new URLSearchParams(
      'q=abc&status=active&sector=Corporate&page=3&pageSize=100&sort=name&dir=asc',
    );
    expect(parseListQuery(params)).toEqual({
      q: 'abc',
      filters: { status: ['active'], sector: ['Corporate'] },
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

  it('ignores malformed filter keys and keeps one dotted part', () => {
    const query = parseListQuery(
      new URLSearchParams(
        'valid-key=value&reviewDate.from=2026-02-01&Invalid=hidden&a.b.c=hidden&.from=hidden',
      ),
    );
    expect(query.filters).toEqual({
      'valid-key': ['value'],
      'reviewDate.from': ['2026-02-01'],
    });
  });

  it('never reads the list params themselves as filters', () => {
    const query = parseListQuery(
      new URLSearchParams('q=bank&sort=name&dir=desc&page=2&pageSize=25'),
    );

    expect(query.filters).toEqual({});
  });

  it('collects repeated filter params into one sorted list without duplicates or blanks', () => {
    const query = parseListQuery(
      new URLSearchParams('status=ARCHIVAL&status=&status=ACTIVE&status=ARCHIVAL&empty='),
    );

    expect(query.filters).toEqual({ status: ['ACTIVE', 'ARCHIVAL'] });
  });

  it('trims filter values and drops the blank ones', () => {
    const query = parseListQuery(new URLSearchParams('lendingRating=%20BBB%20&status=%20%20'));

    expect(query.filters).toEqual({ lendingRating: ['BBB'] });
  });

  it('drops oversized filter values one by one and caps the list', () => {
    const params = new URLSearchParams();
    params.append('id', 'x'.repeat(201));
    for (let index = 0; index < MAX_FILTER_VALUES + 5; index += 1) {
      params.append('id', String(index).padStart(3, '0'));
    }

    const values = parseListQuery(params).filters.id ?? [];

    expect(values).toHaveLength(MAX_FILTER_VALUES);
    expect(values[0]).toBe('000');
    expect(values.at(-1)).toBe(String(MAX_FILTER_VALUES - 1).padStart(3, '0'));
  });

  it('accepts filter keys that name Object.prototype members', () => {
    const query = parseListQuery(new URLSearchParams('constructor=a&toString=b'));

    expect(query.filters).toEqual({ constructor: ['a'], toString: ['b'] });
  });

  it('omits defaults when serializing (short URLs)', () => {
    const query: ListQuery = { ...defaultListQuery, q: 'hello', page: 2 };
    expect(serializeListQuery(query)).toEqual({ q: 'hello', page: '2' });
  });

  it('omits malformed filter entries when serializing', () => {
    const query: ListQuery = {
      ...defaultListQuery,
      filters: {
        'valid-key': ['visible', 'visible', ''],
        'Invalid.key': ['hidden'],
        page: ['hidden'],
        empty: [],
        oversized: ['x'.repeat(201)],
      },
    };

    expect(serializeListQuery(query)).toEqual({ 'valid-key': ['visible'] });
  });

  it('writes every filter value as its own param, in canonical order', () => {
    const query: ListQuery = {
      ...defaultListQuery,
      filters: { type: ['SME', 'CORPORATE'], status: ['ACTIVE'] },
    };

    expect(createSearchParams(serializeListQuery(query)).toString()).toBe(
      'status=ACTIVE&type=CORPORATE&type=SME',
    );
  });

  it('round-trips a non-default query', () => {
    const query: ListQuery = {
      q: 'x',
      filters: { status: ['ACTIVE', 'ARCHIVAL'], sector: ['Public'] },
      sort: 'name',
      dir: 'desc',
      page: 4,
      pageSize: 25,
    };
    expect(parseListQuery(createSearchParams(serializeListQuery(query)))).toEqual(query);
  });

  it('compares filter lists by value', () => {
    const left: ListQuery = { ...defaultListQuery, filters: { status: ['ACTIVE', 'ARCHIVAL'] } };

    expect(
      areListQueriesEqual(left, {
        ...defaultListQuery,
        filters: { status: ['ACTIVE', 'ARCHIVAL'] },
      }),
    ).toBe(true);
    expect(
      areListQueriesEqual(left, { ...defaultListQuery, filters: { status: ['ACTIVE'] } }),
    ).toBe(false);
    expect(
      areListQueriesEqual(left, { ...defaultListQuery, filters: { type: ['ACTIVE', 'ARCHIVAL'] } }),
    ).toBe(false);
  });
});
