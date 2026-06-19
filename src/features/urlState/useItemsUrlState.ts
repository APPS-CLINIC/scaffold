import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseItemsQuery, serializeItemsQuery, type ItemsQuery } from './urlState.schema';

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
 * The write-side counterpart to the URL-as-source-of-truth pattern.
 *
 * Reading state from this hook is fine, but most components should read the
 * mirrored value via `useAppSelector(selectItemsQuery)` so they benefit from
 * reselect memoization. Use `setQuery` here to mutate the URL.
 */
export function useItemsUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => parseItemsQuery(searchParams), [searchParams]);

  const setQuery = useCallback(
    (patch: Partial<ItemsQuery>, options: SetQueryOptions = {}) => {
      const touchesPage = 'page' in patch;
      const next: ItemsQuery = { ...query, ...patch };

      if ((options.resetPage ?? !touchesPage) && !touchesPage) {
        next.page = 1;
      }

      setSearchParams(serializeItemsQuery(next), { replace: options.replace ?? false });
    },
    [query, setSearchParams],
  );

  return { query, setQuery };
}
