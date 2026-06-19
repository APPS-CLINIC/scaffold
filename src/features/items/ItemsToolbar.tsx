import { useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectItemsIsFiltered } from '@/features/urlState/urlState.selectors';
import { useItemsUrlState } from '@/features/urlState/useItemsUrlState';
import { Button, Select, TextInput } from '@/ui';
import styles from './ItemsToolbar.module.css';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * All controls write to the URL via `setQuery`. The search box keeps a local
 * value for responsiveness and commits to the URL (debounced, `replace`) so
 * typing doesn't spam the history stack.
 */
export function ItemsToolbar() {
  const { query, setQuery } = useItemsUrlState();
  const isFiltered = useAppSelector(selectItemsIsFiltered);

  const [search, setSearch] = useState(query.q);

  // Keep the local input in sync when the URL changes externally
  // (back/forward navigation, a shared link).
  useEffect(() => {
    setSearch(query.q);
  }, [query.q]);

  // Debounced commit of the search term to the URL.
  useEffect(() => {
    if (search === query.q) return;
    const handle = window.setTimeout(() => {
      setQuery({ q: search }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [search, query.q, setQuery]);

  return (
    <div className={styles.toolbar}>
      <TextInput
        aria-label="Search items"
        placeholder="Search by name…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className={styles.search}
      />

      <Select
        aria-label="Status filter"
        value={query.status}
        onChange={(event) => setQuery({ status: event.target.value as typeof query.status })}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>

      <Select
        aria-label="Sort field"
        value={query.sort}
        onChange={(event) => setQuery({ sort: event.target.value as typeof query.sort })}
      >
        <option value="createdAt">Created</option>
        <option value="name">Name</option>
        <option value="value">Value</option>
      </Select>

      <Button
        variant="ghost"
        onClick={() => setQuery({ dir: query.dir === 'asc' ? 'desc' : 'asc' })}
        aria-label={`Toggle sort direction (currently ${query.dir})`}
      >
        {query.dir === 'asc' ? '↑ Asc' : '↓ Desc'}
      </Button>

      {isFiltered && (
        <Button variant="ghost" onClick={() => setQuery({ q: '', status: 'all' })}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
