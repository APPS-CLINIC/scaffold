import { useAppSelector } from '@/app/hooks';
import { selectItemsQuery } from '@/features/urlState/urlState.selectors';
import { useGetItemsQuery } from '@/features/items/items.api';
import { ItemsToolbar } from '@/features/items/ItemsToolbar';
import { ItemsTable } from '@/features/items/ItemsTable';
import { ItemsPagination } from '@/features/items/ItemsPagination';

/**
 * Composition root for the items screen. Note the data flow:
 *
 *   URL  ->  UrlStateSync  ->  urlState slice  ->  selectItemsQuery (reselect)
 *        ->  useGetItemsQuery(query)  ->  RTK Query cache  ->  render
 *
 * The query argument comes straight from the mirrored URL state, so the
 * fetched page is always a pure function of the URL.
 */
export function ItemsPage() {
  const query = useAppSelector(selectItemsQuery);
  const { data, isFetching, isError, refetch } = useGetItemsQuery(query);

  if (isError) {
    return (
      <div role="alert">
        Failed to load items. <button onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <section>
      <ItemsToolbar />
      <ItemsTable rows={rows} isFetching={isFetching} />
      <ItemsPagination total={total} />
    </section>
  );
}
