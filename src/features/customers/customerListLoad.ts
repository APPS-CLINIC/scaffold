import { areListQueriesEqual, type ListQuery } from '@/features/urlState/urlState.schema';

/** What a list load changes; the loading notice offers the matching way back. */
export type CustomerListLoadCause = 'first' | 'search' | 'filters' | 'other';

/**
 * Why `next` loads while the list of `shown` is on screen, or `'first'` before any list was
 * shown. Filters win over the search, and everything else (page, sort, refresh, Back) is
 * `'other'`.
 */
export function customerListLoadCause(
  shown: ListQuery | null,
  next: ListQuery,
): CustomerListLoadCause {
  if (shown === null) return 'first';
  if (!areListQueriesEqual({ ...next, filters: shown.filters }, next)) return 'filters';
  if (shown.q !== next.q) return 'search';
  return 'other';
}
