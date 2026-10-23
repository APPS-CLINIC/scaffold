import { Skeleton } from '@/ui';

/** Stands in for the data date, the filters and the search until the first list arrives. */
export function CustomersToolbarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded bg-[var(--surface-muted)] p-3"
    >
      <div className="flex flex-col gap-3">
        <Skeleton width={180} height={16} />
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2, 3].map((bar) => (
            <Skeleton key={bar} width={112} height={12} />
          ))}
        </div>
      </div>
      <Skeleton width={280} height={16} />
    </div>
  );
}
