import { useTranslation } from 'react-i18next';
import { Card, PrimeIcon, Skeleton, Status, useCustomIcon } from '@/ui';
import { CustomerField, ValueSkeleton, type CustomerFieldRow } from './CustomerFields';
import { isAwaitingData } from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';
import { EMPTY_CUSTOMER_SUMMARY } from './customerSummary.adapter';
import { useGetCustomerSummaryQuery } from './customerSummary.api';
import type { CustomerSummary } from './customerSummary.types';

const CUSTOMER_GLYPH = <PrimeIcon name="briefcase" />;

// The panel's two-column split: stacked below lg, side by side from lg. Both columns are
// content-sized and left-aligned, so Rating sits next to the identification data instead of
// being pushed to the middle of the card.
const SPLIT =
  'grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,max-content)_minmax(0,max-content)] lg:justify-start lg:gap-x-12';

function SummaryHeader({ summary, empty }: { summary: CustomerSummary; empty: string }) {
  const { t } = useTranslation();
  const fullName = summary.fullName?.trim() ? summary.fullName : empty;

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <h2
        className="m-0 w-full min-w-0 truncate text-2xl font-bold text-[var(--text)]"
        title={summary.fullName?.trim() ? summary.fullName : undefined}
      >
        {fullName}
      </h2>
      <div className="min-h-7">
        {summary.status === 'ACTIVE' ? (
          <Status type="active" label={t('common.status.active')} />
        ) : summary.status === 'ARCHIVAL' ? (
          <Status type="disabled" label={t('common.status.archival')} />
        ) : (
          <span className="text-sm text-[var(--text)]">{empty}</span>
        )}
      </div>
    </div>
  );
}

/** Same footprint as the loaded header so nothing shifts once data arrives. */
function SummaryHeaderSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex min-w-0 flex-col items-start gap-1">
      <span className="block h-8 w-2/5 min-w-0">
        <span className="block h-7 overflow-hidden rounded">
          <Skeleton width="100%" height="100%" borderRadius="inherit" />
        </span>
      </span>
      <span className="block h-7 w-20 shrink-0">
        <span className="block h-6 overflow-hidden rounded">
          <Skeleton width="100%" height="100%" borderRadius="inherit" />
        </span>
      </span>
    </div>
  );
}

/** Persistent panel above every customer tab: icon, name/status header, overview + two detail columns. */
export function CustomerSummaryPanel({ customerId }: { customerId: string }) {
  const { t } = useTranslation();
  const format = useCustomerFormatters();
  const summaryQuery = useGetCustomerSummaryQuery(customerId); // shares the layout's cache entry, no extra request
  const CustomerIcon = useCustomIcon(CUSTOMER_GLYPH, { size: '2xl', tone: 'brand' });
  const loading = isAwaitingData(summaryQuery);
  const summary = summaryQuery.currentData ?? EMPTY_CUSTOMER_SUMMARY; // a failed request renders the empty panel, not a skeleton
  const empty = t('customers.value.notAvailable');
  const rating = summary.rating?.trim() ? summary.rating : null;

  const overview: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.summaryPanel.field.grid', value: summary.grid },
    { labelKey: 'customers.summaryPanel.field.kkf', value: summary.kkf },
    {
      labelKey: 'customers.summaryPanel.field.internalGroupName',
      value: summary.internalGroupName,
    },
    {
      labelKey: 'customers.summaryPanel.field.corporateGroupName',
      value: summary.corporateGroupName,
    },
    {
      labelKey: 'customers.summaryPanel.field.corporateGroupGrid',
      value: summary.corporateGroupGrid,
    },
  ];
  const identification: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.summaryPanel.field.pamName', value: summary.pamName },
    { labelKey: 'customers.summaryPanel.field.pamLam', value: summary.pamLam },
    { labelKey: 'customers.summaryPanel.field.homeCountry', value: summary.homeCountry },
    { labelKey: 'customers.summaryPanel.field.segmentColor', value: summary.segmentColor },
  ];
  const rows = (list: readonly CustomerFieldRow[]) =>
    list.map((row) => <CustomerField key={row.labelKey} compact loading={loading} {...row} />);

  return (
    <Card>
      <div
        aria-busy={loading || undefined}
        className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:gap-y-0 lg:grid-cols-4 lg:gap-x-0"
      >
        <div className="flex shrink-0 items-start justify-start md:self-stretch md:justify-center">
          <CustomerIcon />
        </div>
        <div className="min-w-0 space-y-4 md:col-start-2 lg:col-span-3">
          {loading ? (
            <SummaryHeaderSkeleton label={t('customers.summaryPanel.loading')} />
          ) : (
            <SummaryHeader summary={summary} empty={empty} />
          )}
          <div className={SPLIT}>
            <div className="min-w-0 space-y-1">{rows(overview)}</div>
          </div>
          <div className={SPLIT}>
            <section className="min-w-0">
              <h3 className="mb-2 mt-0 text-xl font-bold text-[var(--text)]">
                {t('customers.summaryPanel.column.identification')}
              </h3>
              <div className="min-w-0 space-y-1">{rows(identification)}</div>
            </section>
            <section className="min-w-0">
              <h3 className="mb-2 mt-0 text-xl font-bold text-[var(--text)]">
                {t('customers.summaryPanel.column.rating')}
              </h3>
              <div className="min-w-0 space-y-1">
                <span
                  className="block h-5 min-w-0 truncate text-[var(--text)]"
                  title={rating ?? undefined}
                >
                  {loading ? <ValueSkeleton /> : (rating ?? empty)}
                </span>
                <CustomerField
                  compact
                  loading={loading}
                  labelKey="customers.summaryPanel.field.lendingRatingDate"
                  value={format.date(summary.lendingRatingDate)}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </Card>
  );
}
