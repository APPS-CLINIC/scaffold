import { useCallback, useMemo } from 'react';
import { createSearchParams, useSearchParams } from 'react-router-dom';
import {
  areListQueriesEqual,
  parseListQuery,
  serializeListQuery,
  type ListQuery,
} from './urlState.schema';

export interface SetQueryOptions {
  /**
   * Reset pagination to page 1. Defaults to `true` for any change that does
   * not itself touch `page` (changing a filter should bring you back to the
   * first page). Paging controls pass `page` explicitly and keep it.
   */
  resetPage?: boolean;
  /** Use history.replace instead of push — handy for debounced search typing. */
  replace?: boolean;
}

/**
 * The write-side counterpart to the URL-as-source-of-truth pattern. A patch that leaves the
 * query as it is does nothing: no navigation and no reset to page 1. A `filters` patch
 * replaces every filter param, also those the caller does not own (another feature's, or
 * `utm_source`), so build it from the current filters to keep them.
 *
 * Reading state from this hook is fine, but most components should read the
 * mirrored value via `useAppSelector(selectListQuery)` so they benefit from
 * reselect memoization. Use `setQuery` here to mutate the URL.
 */
export function useListQueryState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => parseListQuery(searchParams), [searchParams]);

  const setQuery = useCallback(
    (patch: Partial<ListQuery>, options: SetQueryOptions = {}) => {
      const touchesPage = 'page' in patch;
      // The round trip gives the patch the URL's canonical form, so an equal query is noticed.
      const next = parseListQuery(createSearchParams(serializeListQuery({ ...query, ...patch })));
      if (areListQueriesEqual(next, query)) return;

      if ((options.resetPage ?? !touchesPage) && !touchesPage) {
        next.page = 1;
      }

      setSearchParams(serializeListQuery(next), { replace: options.replace ?? false });
    },
    [query, setSearchParams],
  );

  return { query, setQuery };
}
