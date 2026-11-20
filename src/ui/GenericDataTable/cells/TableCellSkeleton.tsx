export interface TableCellSkeletonProps {
  rowIndex?: number;
}

/** Decorative one-line placeholder shared by flat and hierarchy table cells. */
export function TableCellSkeleton({ rowIndex = 0 }: TableCellSkeletonProps) {
  return (
    <span aria-hidden="true" className="flex h-5 items-center">
      <span
        className="block h-3 w-3/4 rounded bg-[var(--table-skeleton)] motion-safe:animate-pulse"
        style={{ animationDelay: `${rowIndex * 50}ms` }}
      />
    </span>
  );
}
