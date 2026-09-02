import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import {
  Card,
  DataPanel,
  DataPanelSkeleton,
  PrimeIcon,
  Status,
  renderCellValue,
  useCustomIcon,
} from '@/ui';
import { selectCustomerSummary, selectCustomerSummaryStatus } from './customerSummary.selectors';
import {
  customerSummaryPanelColumnLabels,
  customerSummaryPanelFields,
} from './customerSummaryPanelFields';
import type { CustomerSummary } from './customerSummary.types';

const CUSTOMER_GLYPH = <PrimeIcon name="briefcase" />;

const EMPTY_CUSTOMER_SUMMARY: CustomerSummary = {
  fullName: '',
  grid: '',
  corporateGroupName: null,
  corporateGroupGrid: null,
  internalGroupName: null,
  pamLam: null,
  homeCountry: null,
  segmentColor: null,
  rating: null,
  status: null,
  kkf: null,
  pamName: null,
  lendingRatingDate: null,
  cddRiskLevel: null,
  cddExpirationDate: null,
};

function CustomerSummaryHeader({
  summary,
  emptyValue,
}: {
  summary: CustomerSummary;
  emptyValue: ReactNode;
}) {
  const { t } = useTranslation();
  const fullName = renderCellValue(summary.fullName, emptyValue);

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <h2
        className="m-0 w-full min-w-0 truncate text-2xl font-bold text-[var(--text)]"
        title={summary.fullName || undefined}
      >
        {fullName}
      </h2>
      <div className="min-h-7">
        {summary.status === 'ACTIVE' ? (
          <Status type="active" label={t('common.status.active')} />
        ) : summary.status === 'ARCHIVAL' ? (
          <Status type="disabled" label={t('common.status.archival')} />
        ) : (
          <span className="text-sm text-[var(--text)]">{emptyValue}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Container: connects the read-only Redux mirror + field config to the
 * generic `DataPanel`. `CustomerDetailLayout` places it outside the per-tab
 * outlet on every summary-bearing customer view; the dashboard is the single
 * product-defined exception because it owns a different header.
 */
export function CustomerSummaryPanel({ customerId }: { customerId: string }) {
  const { t } = useTranslation();
  const summary = useAppSelector((state) => selectCustomerSummary(state, customerId));
  const status = useAppSelector((state) => selectCustomerSummaryStatus(state, customerId));
  const CustomerIcon = useCustomIcon(CUSTOMER_GLYPH, { size: '2xl', tone: 'brand' });
  const emptyValue = t('customers.value.notAvailable');

  if (status !== 'failed' && (!summary || status !== 'succeeded')) {
    return (
      <Card>
        <div role="status" aria-label={t('customers.summaryPanel.loading')}>
          <DataPanelSkeleton
            fields={customerSummaryPanelFields}
            columnLabels={customerSummaryPanelColumnLabels}
            hasIcon
            iconSize="hero"
            hasHeader
          />
        </div>
      </Card>
    );
  }

  const panelSummary = summary ?? EMPTY_CUSTOMER_SUMMARY;

  return (
    <Card>
      <DataPanel
        data={panelSummary}
        icon={<CustomerIcon />}
        header={<CustomerSummaryHeader summary={panelSummary} emptyValue={emptyValue} />}
        columnLabels={customerSummaryPanelColumnLabels}
        fields={customerSummaryPanelFields}
        emptyValue={emptyValue}
      />
    </Card>
  );
}
