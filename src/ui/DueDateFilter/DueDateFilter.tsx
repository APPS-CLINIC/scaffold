import { forwardRef, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Chips, twMerge } from 'iwa-react-components';
import type { MessageKey } from '@/i18n/messages/pl';
import { DUE_DATE_FILTERS, type DueDateFilterValue } from './dueDateWindows';

const LABEL_KEYS: Record<DueDateFilterValue, MessageKey> = {
  all: 'common.dueDateFilter.all',
  upTo30Days: 'common.dueDateFilter.upTo30Days',
  over30Days: 'common.dueDateFilter.over30Days',
  overdue: 'common.dueDateFilter.overdue',
};

const isDueDateFilter = (value: unknown): value is DueDateFilterValue =>
  typeof value === 'string' && (DUE_DATE_FILTERS as readonly string[]).includes(value);

export interface DueDateFilterProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  value: DueDateFilterValue;
  onChange: (value: DueDateFilterValue) => void;
}

/**
 * Single-choice IWA `Chips` over the due-date windows: all, up to 30 days, over 30 days,
 * overdue. Controlled — the owning view keeps the value and filters its items with
 * `filterByDueDate`. Only a newly picked window is reported, so the choice can never be
 * cleared. The group also names the chosen filter in visually hidden text, whatever the IWA
 * chips expose to assistive technology. A caller's `aria-label` replaces the default name.
 */
export const DueDateFilter = forwardRef<HTMLDivElement, DueDateFilterProps>(function DueDateFilter(
  { value, onChange, className, ...rest },
  ref,
) {
  const { t } = useTranslation();

  return (
    <div
      ref={ref}
      role="group"
      aria-label={t('common.dueDateFilter.ariaLabel')}
      className={twMerge('min-w-0', className)}
      {...rest}
    >
      <Chips
        value={value}
        onChange={(next: unknown) => {
          if (isDueDateFilter(next) && next !== value) onChange(next);
        }}
        wrap
      >
        {DUE_DATE_FILTERS.map((filter) => (
          <Chips.Chip key={filter} label={t(LABEL_KEYS[filter])} value={filter} />
        ))}
      </Chips>
      <span className="sr-only" aria-live="polite">
        {t('common.dueDateFilter.selected', { label: t(LABEL_KEYS[value]) })}
      </span>
    </div>
  );
});
