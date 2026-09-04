import { useId, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { Card, Skeleton } from '@/ui';

/** A formatted value. Booleans and addresses must go through useCustomerFormatters() first. */
export type CustomerFieldValue = string | ReactElement | null | undefined;

export interface CustomerFieldRow {
  labelKey: MessageKey;
  value: CustomerFieldValue;
}

// Row geometry.
// Compact (summary panel): 2fr/3fr label/value split, content-sized left-aligned label from md.
// Fixed (detail tabs): stacked below sm, 2fr/3fr from sm, a 300px right-aligned label column
// from md so the longest configured label stays on one line.
const COMPACT = {
  dl: 'm-0 grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-1 md:grid-cols-[max-content_minmax(0,1fr)]',
  dt: 'min-w-0 break-words text-sm font-bold text-[var(--text)]',
  dd: 'm-0 min-w-0 break-words text-sm text-[var(--text)]',
};
const FIXED = {
  dl: 'm-0 grid min-w-0 grid-cols-1 items-start gap-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-x-2 md:flex md:gap-4',
  dt: 'min-w-0 break-words text-sm font-bold text-[var(--text)] md:w-[300px] md:shrink-0 md:text-right',
  dd: 'm-0 min-w-0 break-words text-sm text-[var(--text)] md:flex-1',
};

const isEmpty = (value: CustomerFieldValue): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/**
 * One label/value row rendered as its own `<dl>`. The IWA DefinitionList accepts string text
 * only, and values such as the expiry date render an element.
 */
export function CustomerField({
  labelKey,
  value,
  loading = false,
  compact = false,
}: CustomerFieldRow & { loading?: boolean; compact?: boolean }) {
  const { t } = useTranslation();
  const geometry = compact ? COMPACT : FIXED;
  const empty = isEmpty(value);
  const shown = empty ? t('customers.value.notAvailable') : value;

  return (
    <dl className={geometry.dl}>
      <dt className={geometry.dt}>
        {t(labelKey)}
        <span aria-hidden="true">:</span>
      </dt>
      <dd className={geometry.dd}>
        {loading ? (
          <ValueSkeleton />
        ) : (
          <span
            className={compact ? 'block min-w-0 truncate' : 'block min-h-5 min-w-0'}
            title={compact && !empty && typeof value === 'string' ? value : undefined}
          >
            {shown}
          </span>
        )}
      </dd>
    </dl>
  );
}

/** The IWA Skeleton takes no styling props; the wrapping span owns size, radius and overflow. */
export function ValueSkeleton() {
  return (
    <span className="block h-5 w-3/5 overflow-hidden rounded" aria-hidden="true">
      <Skeleton width="100%" height="100%" borderRadius="inherit" />
    </span>
  );
}

export interface CustomerFieldGroup {
  /** Optional sub-heading; rendered above its own rows, inside the same card. */
  titleKey?: MessageKey;
  rows: readonly CustomerFieldRow[];
}

type SectionContent =
  | { rows: readonly CustomerFieldRow[]; groups?: never }
  | { groups: readonly CustomerFieldGroup[]; rows?: never };

/**
 * One titled card band. The section title sits above its rows (not beside them), and a
 * section may hold several titled groups separated by a full-width divider, as the CDD
 * card does with "Data ICBS" and "Scope file data".
 */
export function CustomerDetailSection({
  titleKey,
  loading,
  ...content
}: { titleKey: MessageKey; loading: boolean } & SectionContent) {
  const { t } = useTranslation();
  const headingId = useId();
  const groups: readonly CustomerFieldGroup[] = content.groups ?? [{ rows: content.rows ?? [] }];

  return (
    <Card>
      <section aria-labelledby={headingId} className="min-w-0">
        <h3 id={headingId} className="m-0 text-lg font-bold leading-6 text-[var(--text)]">
          {t(titleKey)}
        </h3>
        {groups.map((group, index) => (
          <div key={group.titleKey ?? 'rows'} className="min-w-0">
            {index > 0 ? (
              <hr className="my-4 border-0 border-t border-[var(--border-subtle)]" />
            ) : null}
            {group.titleKey ? (
              <h4 className="m-0 mt-3 text-sm font-bold text-[var(--text)]">{t(group.titleKey)}</h4>
            ) : null}
            <div className="mt-3 grid min-w-0 grid-cols-1 lg:grid-cols-4">
              <div className="min-w-0 space-y-1 lg:col-span-3 lg:col-start-2">
                {group.rows.map((row) => (
                  <CustomerField key={row.labelKey} {...row} loading={loading} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </Card>
  );
}
