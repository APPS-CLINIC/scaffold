import { twMerge } from 'iwa-react-components';
import type { GenericDataTableLabels } from '../GenericDataTable.types';

interface RowExpansionButtonProps<T extends object> {
  detailsId: string;
  expanded: boolean;
  labels: GenericDataTableLabels<T>;
  onToggle: () => void;
  row: T;
}

export function RowExpansionButton<T extends object>({
  detailsId,
  expanded,
  labels,
  onToggle,
  row,
}: RowExpansionButtonProps<T>) {
  return (
    <button
      id={`${detailsId}-toggle`}
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus)] motion-reduce:transition-none sm:min-h-8 sm:min-w-8"
      aria-controls={expanded ? detailsId : undefined}
      aria-expanded={expanded}
      aria-label={expanded ? labels.collapseRow(row) : labels.expandRow(row)}
      onClick={onToggle}
    >
      <span
        aria-hidden="true"
        className={twMerge(
          'pi pi-chevron-down text-xs transition-transform motion-reduce:transition-none',
          expanded && 'rotate-180',
        )}
      />
    </button>
  );
}
