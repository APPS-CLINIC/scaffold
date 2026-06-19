import { describe, expect, it } from 'vitest';
import { defaultItemsQuery, type ItemsQuery } from '@/features/urlState/urlState.schema';
import { queryMockItems } from './items.mock';

const baseQuery = (overrides: Partial<ItemsQuery> = {}): ItemsQuery => ({
  ...defaultItemsQuery,
  ...overrides,
});

describe('queryMockItems', () => {
  it('respects pageSize and reports the full total', async () => {
    const page = await queryMockItems(baseQuery({ pageSize: 50, status: 'all', q: '' }));
    expect(page.rows).toHaveLength(50);
    expect(page.total).toBe(10_000);
  });

  it('filters by status', async () => {
    const page = await queryMockItems(baseQuery({ status: 'active', pageSize: 200 }));
    expect(page.rows.every((row) => row.status === 'active')).toBe(true);
    expect(page.total).toBe(5_000);
  });

  it('filters by search term', async () => {
    const page = await queryMockItems(baseQuery({ q: 'item 00001', pageSize: 50 }));
    expect(page.total).toBe(1);
    expect(page.rows[0]?.name).toBe('Item 00001');
  });

  it('sorts ascending and descending', async () => {
    const asc = await queryMockItems(baseQuery({ sort: 'value', dir: 'asc', pageSize: 200 }));
    const values = asc.rows.map((row) => row.value);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });

  it('paginates without overlap', async () => {
    const first = await queryMockItems(
      baseQuery({ page: 1, pageSize: 25, sort: 'name', dir: 'asc' }),
    );
    const second = await queryMockItems(
      baseQuery({ page: 2, pageSize: 25, sort: 'name', dir: 'asc' }),
    );
    const overlap = first.rows.filter((row) => second.rows.some((other) => other.id === row.id));
    expect(overlap).toHaveLength(0);
  });
});
