import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from '@/ui';

export interface FacilityChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-pressed' | 'type'
> {
  selected: boolean;
}

/** Pressed-state chip shared by the group and facility-level selectors. */
export function FacilityChip({ selected, className, children, ...rest }: FacilityChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={twMerge(
        'rounded-full border border-[var(--accent)] px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]',
        selected ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--accent)]',
        className,
      )}
      {...rest}
    >
      {selected ? (
        <span aria-hidden="true" className="mr-1">
          ✓
        </span>
      ) : null}
      {children}
    </button>
  );
}
