import { forwardRef, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Chips, twMerge } from 'iwa-react-components';
import type { MessageKey } from '@/i18n/messages/pl';
import { DUE_DATE_WINDOWS, type DueDateSelection, type DueDateWindow } from './dueDateWindows';

const ALL = 'all';

type ChipValue = typeof ALL | DueDateWindow;

const CHIP_VALUES: readonly ChipValue[] = [ALL, ...DUE_DATE_WINDOWS];

const LABEL_KEYS: Record<ChipValue, MessageKey> = {
  all: 'common.dueDateFilter.all',
  upTo30Days: 'common.dueDateFilter.upTo30Days',
  over30Days: 'common.dueDateFilter.over30Days',
  overdue: 'common.dueDateFilter.overdue',
};

/**
 * The windows chosen after a change of the chip group. "All" is exclusive: picking it clears
 * the windows, picking a window drops it, and unselecting the last window brings it back.
 */
function nextSelection(next: unknown, current: DueDateSelection): DueDateSelection | null {
  if (!Array.isArray(next)) return null;
  if (current.length > 0 && next.includes(ALL)) return [];
  return DUE_DATE_WINDOWS.filter((window) => next.includes(window));
}

const sameSelection = (a: DueDateSelection, b: DueDateSelection) =>
  a.length === b.length && a.every((window) => b.includes(window));

export interface DueDateFilterProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  value: DueDateSelection;
  onChange: (value: DueDateSelection) => void;
}

/**
 * IWA `Chips` over the due-date windows — all, up to 30 days, over 30 days, overdue — where
 * several windows can be chosen together. Controlled: the owning view keeps the chosen windows
 * and filters its items with `filterByDueDate`; no window chosen means all. The group also names
 * the chosen filters in visually hidden text, whatever the IWA chips expose to assistive
 * technology. A caller's `aria-label` replaces the default group name.
 */
export const DueDateFilter = forwardRef<HTMLDivElement, DueDateFilterProps>(function DueDateFilter(
  { value, onChange, className, ...rest },
  ref,
) {
  const { t } = useTranslation();
  const chosen: readonly ChipValue[] = value.length === 0 ? [ALL] : value;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={t('common.dueDateFilter.ariaLabel')}
      className={twMerge('min-w-0', className)}
      {...rest}
    >
      <Chips
        multiple
        value={[...chosen]}
        onChange={(next: unknown) => {
          const selection = nextSelection(next, value);
          if (selection && !sameSelection(selection, value)) onChange(selection);
        }}
        wrap
      >
        {CHIP_VALUES.map((chip) => (
          <Chips.Chip key={chip} label={t(LABEL_KEYS[chip])} value={chip} />
        ))}
      </Chips>
      <span className="sr-only" aria-live="polite">
        {t('common.dueDateFilter.selected', {
          labels: chosen.map((chip) => t(LABEL_KEYS[chip])).join(', '),
        })}
      </span>
    </div>
  );
});
