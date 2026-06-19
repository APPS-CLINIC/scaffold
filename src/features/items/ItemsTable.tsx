import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Item } from './items.types';
import styles from './ItemsTable.module.css';

const ROW_HEIGHT = 40;

export interface ItemsTableProps {
  rows: Item[];
  isFetching: boolean;
}

/**
 * Row-virtualized table: only the rows currently in view (plus a small
 * overscan) are mounted to the DOM, so rendering stays O(viewport) even with
 * thousands of rows. Pair this with server-side pagination for very large
 * datasets — here both are in play.
 */
export function ItemsTable({ rows, isFetching }: ItemsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  return (
    <div className={styles.wrapper} data-fetching={isFetching || undefined}>
      <div className={styles.headerRow} role="row">
        <span className={styles.cellName}>Name</span>
        <span className={styles.cellStatus}>Status</span>
        <span className={styles.cellValue}>Value</span>
        <span className={styles.cellDate}>Created</span>
      </div>

      <div ref={scrollRef} className={styles.scroll} role="rowgroup">
        <div className={styles.viewport} style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = rows[virtualRow.index];
            if (!item) return null;
            return (
              <div
                key={item.id}
                role="row"
                className={styles.bodyRow}
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span className={styles.cellName} title={item.name}>
                  {item.name}
                </span>
                <span className={styles.cellStatus}>
                  <span className={styles[item.status]}>{item.status}</span>
                </span>
                <span className={styles.cellValue}>{item.value.toFixed(1)}</span>
                <span className={styles.cellDate}>{item.createdAt.slice(0, 10)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {rows.length === 0 && <div className={styles.empty}>No items match your filters.</div>}
    </div>
  );
}
