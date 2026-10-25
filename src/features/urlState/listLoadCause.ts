import { areListQueriesEqual, type ListQuery } from './urlState.schema';

/** What a list load changes, so its loading notice can offer the matching way back. */
export type ListLoadCause = 'first' | 'search' | 'filters' | 'other';

/**
 * Why `next` loads while the list of `shown` is on screen, or `'first'` before any list was
 * shown. Filters win over the search, and everything else (page, sort, refresh, Back) is
 * `'other'`.
 */
export function listLoadCause(shown: ListQuery | null, next: ListQuery): ListLoadCause {
  if (shown === null) return 'first';
  if (!areListQueriesEqual({ ...next, filters: shown.filters }, next)) return 'filters';
  if (shown.q !== next.q) return 'search';
  return 'other';
}
