import type { ItemsQuery } from '@/features/urlState/urlState.schema';
import type { Item, ItemsPage } from './items.types';

/**
 * In-memory mock backend so the scaffold runs with zero infrastructure.
 * Replace by switching `items.api.ts` from `queryFn` to a real `query`.
 */
const TOTAL = 10_000;

const DATASET: readonly Item[] = Array.from({ length: TOTAL }, (_, i): Item => {
  // Cheap deterministic pseudo-random so data is stable across reloads.
  const pseudo = (i * 9301 + 49297) % 233280;
  return {
    id: String(i + 1),
    name: `Item ${String(i + 1).padStart(5, '0')}`,
    status: i % 2 === 0 ? 'active' : 'inactive',
    value: Math.round((pseudo / 233280) * 1000) / 10,
    createdAt: new Date(Date.UTC(2024, 0, 1) + i * 3_600_000).toISOString(),
  };
});

function compare(a: Item, b: Item, sort: ItemsQuery['sort']): number {
  if (sort === 'value') return a.value - b.value;
  return String(a[sort]).localeCompare(String(b[sort]));
}

/** Simulate a paginated, filtered, sorted server endpoint. */
export async function queryMockItems(query: ItemsQuery): Promise<ItemsPage> {
  await new Promise((resolve) => setTimeout(resolve, 150)); // fake network latency

  let rows = DATASET as Item[];

  if (query.q) {
    const needle = query.q.toLowerCase();
    rows = rows.filter((row) => row.name.toLowerCase().includes(needle));
  }
  if (query.status !== 'all') {
    rows = rows.filter((row) => row.status === query.status);
  }

  const direction = query.dir === 'asc' ? 1 : -1;
  rows = [...rows].sort((a, b) => compare(a, b, query.sort) * direction);

  const total = rows.length;
  const start = (query.page - 1) * query.pageSize;
  rows = rows.slice(start, start + query.pageSize);

  return { rows, total };
}
