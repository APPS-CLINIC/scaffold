import { forwardRef, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { Chip } from '@/ui';
import { cx } from '../cx';
import { DUE_DATE_FILTERS, type DueDateFilterValue } from './dueDateWindows';

const LABEL_KEYS: Record<DueDateFilterValue, MessageKey> = {
  all: 'common.dueDateFilter.all',
  upTo30Days: 'common.dueDateFilter.upTo30Days',
  over30Days: 'common.dueDateFilter.over30Days',
  overdue: 'common.dueDateFilter.overdue',
};

export interface DueDateFilterProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  value: DueDateFilterValue;
  onChange: (value: DueDateFilterValue) => void;
}

/**
 * Single-choice IWA chips over the due-date windows: all, up to 30 days, over 30 days, overdue.
 * Controlled — the owning view keeps the value and filters its items with `filterByDueDate`.
 * IWA Chip exposes no pressed state, so the group names the chosen filter in visually hidden
 * text. A caller's `aria-label` replaces the default group name.
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
      className={cx('flex flex-wrap items-center gap-2', className)}
      {...rest}
    >
      {DUE_DATE_FILTERS.map((filter) => (
        <Chip
          key={filter}
          label={t(LABEL_KEYS[filter])}
          selected={filter === value}
          showSelection
          onClick={() => {
            if (filter !== value) onChange(filter);
          }}
        />
      ))}
      <span className="sr-only" aria-live="polite">
        {t('common.dueDateFilter.selected', { label: t(LABEL_KEYS[value]) })}
      </span>
    </div>
  );
});
