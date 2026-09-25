import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import { ActionLink } from '@/ui';

export interface CustomerDataAsOfProps {
  /** When the shown data arrived; while it has not, the line shows today. */
  fulfilledTimeStamp: number | undefined;
  onRefresh: () => PromiseLike<unknown>;
}

/** The "As of: <date> ⟳ Refresh" line above a detail part's rows. */
export function CustomerDataAsOf({ fulfilledTimeStamp, onRefresh }: CustomerDataAsOfProps) {
  const { t, i18n } = useTranslation();

  const dataAsOf = useMemo(
    () =>
      new Intl.DateTimeFormat(
        i18n.resolvedLanguage ?? i18n.language,
        DATE_DMY_FORMAT_OPTIONS,
      ).format(new Date(fulfilledTimeStamp ?? Date.now())),
    [fulfilledTimeStamp, i18n.language, i18n.resolvedLanguage],
  );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
      <span>{t('customers.dataAsOf')}</span>
      <strong className="font-bold text-[var(--text)]">{dataAsOf}</strong>
      {/* The IWA link box is taller than the line; the fixed-height slot keeps it from pushing
          the rows below further down. */}
      <span className="inline-flex h-5 items-center">
        <ActionLink
          icon={
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0 text-[var(--navigation-accent)]"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" />
            </svg>
          }
          label={t('customers.actions.refresh')}
          onClick={async () => {
            await onRefresh();
          }}
        />
      </span>
    </div>
  );
}
