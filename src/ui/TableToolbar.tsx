import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'iwa-react-components';

export interface TableToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  filters: ReactNode;
  search: ReactNode;
  actions?: ReactNode;
}

/** Shared filter/search/action layout; the owner supplies controls and their state. */
export const TableToolbar = forwardRef<HTMLDivElement, TableToolbarProps>(function TableToolbar(
  { filters, search, actions, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={twMerge(
        'mb-4 flex min-w-0 flex-col items-start gap-8 rounded bg-[var(--surface-muted)] p-3',
        className,
      )}
      {...rest}
    >
      {filters}
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {search}
        {actions}
      </div>
    </div>
  );
});
