import { useItemsUrlState } from '@/features/urlState/useItemsUrlState';
import { Button } from '@/ui';
import styles from './ItemsPagination.module.css';

export interface ItemsPaginationProps {
  total: number;
}

export function ItemsPagination({ total }: ItemsPaginationProps) {
  const { query, setQuery } = useItemsUrlState();
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const canPrev = query.page > 1;
  const canNext = query.page < pageCount;

  return (
    <div className={styles.pagination}>
      <span className={styles.summary}>
        {total.toLocaleString()} items · page {query.page} / {pageCount}
      </span>

      <div className={styles.controls}>
        <Button
          variant="ghost"
          disabled={!canPrev}
          onClick={() => setQuery({ page: query.page - 1 })}
        >
          ← Prev
        </Button>
        <Button
          variant="ghost"
          disabled={!canNext}
          onClick={() => setQuery({ page: query.page + 1 })}
        >
          Next →
        </Button>

        <label className={styles.pageSize}>
          Rows
          <select
            value={query.pageSize}
            onChange={(event) => setQuery({ pageSize: Number(event.target.value) })}
          >
            {[25, 50, 100, 200].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
