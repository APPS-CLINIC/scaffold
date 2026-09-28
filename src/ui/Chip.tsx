import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { twMerge } from 'iwa-react-components';

export interface ChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children'
> {
  label: string;
  selected?: boolean;
  /** Shows a check mark before the label while the chip is selected. */
  showSelection?: boolean;
  onClick?: () => void;
  dataTestId?: string;
}

// TODO: swap for the IWA Chip once iwa-react-components exports it correctly. The props above
// keep the IWA ChipProps names, so the swap only changes the export in src/ui/index.ts.
/**
 * Pill-shaped toggle chip. A selected chip takes the accent fill and, with `showSelection`, a
 * check mark; the state is exposed to assistive technology through `aria-pressed`.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  {
    label,
    selected = false,
    showSelection = false,
    onClick,
    disabled,
    className,
    dataTestId,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-pressed={selected}
      disabled={disabled}
      data-testid={dataTestId}
      onClick={onClick ? () => onClick() : undefined}
      className={twMerge(
        'inline-flex max-w-64 items-center gap-1.5 rounded-full border px-3 py-0.5 text-sm leading-5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--muted)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]',
        disabled && 'cursor-default opacity-50',
        className,
      )}
    >
      {selected && showSelection ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 shrink-0"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
});
