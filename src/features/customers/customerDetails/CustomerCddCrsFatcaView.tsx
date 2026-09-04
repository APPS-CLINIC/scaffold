import { useTranslation } from 'react-i18next';
import { CustomerDetailSection, type CustomerFieldRow } from './CustomerFields';
import { EMPTY_CUSTOMER_DETAILS } from './customerDetails.adapter';
import { isAwaitingData, useGetCustomerDetailsQuery } from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';
import { EMPTY_CUSTOMER_SUMMARY } from './customerSummary.adapter';
import { useGetCustomerSummaryQuery } from './customerSummary.api';

export interface CustomerCddCrsFatcaViewProps {
  customerId: string;
}

/**
 * Rows that have no backend binding yet. They render the shared "not available" value.
 * Remove this constant once every row is bound to a field.
 */
const NOT_MAPPED = null;

/**
 * Route content for the CDD/CRS/FATCA tab. Card and row order follow the design; the CDD card
 * holds the "Data ICBS" and "Scope file data" groups separated by one divider.
 */
export function CustomerCddCrsFatcaView({ customerId }: CustomerCddCrsFatcaViewProps) {
  const { t } = useTranslation();
  const format = useCustomerFormatters();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const summaryQuery = useGetCustomerSummaryQuery(customerId); // shares the layout's cache entry, no extra request
  const details = detailsQuery.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const summary = summaryQuery.currentData ?? EMPTY_CUSTOMER_SUMMARY;
  const loading = isAwaitingData(detailsQuery) || isAwaitingData(summaryQuery);

  const dataIcbs: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.compliance.field.cddDate', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddRiskLevel', value: summary.cddRiskLevel },
    {
      labelKey: 'customers.details.compliance.field.cddExpirationDate',
      value: format.expiry(summary.cddExpirationDate),
    },
    { labelKey: 'customers.details.compliance.field.cddApprovalDate', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddRiskLevelVantage', value: NOT_MAPPED },
    {
      labelKey: 'customers.details.compliance.field.cddExpirationDateVantage',
      value: NOT_MAPPED,
    },
    { labelKey: 'customers.details.compliance.field.cddOwner', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddFirstPreExitLetter', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddSecondPreExitLetter', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.mlroDeviationFrom', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.mlroDeviationTo', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.mlroDeviationFlag', value: NOT_MAPPED },
  ];

  const scopeFile: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.compliance.field.scopeFileGroup', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.scopeFileCluster', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.scopeFileSprint', value: NOT_MAPPED },
    {
      labelKey: 'customers.details.compliance.field.scopeFileSprintStartDate',
      value: NOT_MAPPED,
    },
    {
      labelKey: 'customers.details.compliance.field.scopeFileSprintEndDate',
      value: NOT_MAPPED,
    },
  ];

  const crs: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.compliance.field.crsProcessType',
      value: details.crs.crsProcessType,
    },
    {
      labelKey: 'customers.details.compliance.field.crsReviewDate',
      value: format.date(details.crs.crsReviewDate),
    },
    { labelKey: 'customers.details.compliance.field.crsStatus', value: details.crs.crsStatus },
    {
      labelKey: 'customers.details.compliance.field.crsClassificationDate',
      value: format.date(details.crs.crsClassificationDate),
    },
  ];

  const fatca: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.compliance.field.fatcaReviewType',
      value: details.fatca.fatcaReviewType,
    },
    {
      labelKey: 'customers.details.compliance.field.fatcaReviewDate',
      value: format.expiry(details.fatca.fatcaReviewDate),
    },
    {
      labelKey: 'customers.details.compliance.field.fatcaStatus',
      value: details.fatca.fatcaStatus,
    },
    {
      labelKey: 'customers.details.compliance.field.fatcaClassificationDate',
      value: format.date(details.fatca.fatcaClassificationDate),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t('customers.details.compliance.ariaLabel')}
      aria-busy={loading || undefined}
      className="min-w-0 space-y-4"
    >
      {detailsQuery.isError || summaryQuery.isError ? (
        <p role="alert" className="sr-only">
          {t('customers.details.data.error')}
        </p>
      ) : null}
      <CustomerDetailSection
        titleKey="customers.details.compliance.section.cdd"
        groups={[
          { titleKey: 'customers.details.compliance.subsection.dataIcbs', rows: dataIcbs },
          { titleKey: 'customers.details.compliance.subsection.scopeFileData', rows: scopeFile },
        ]}
        loading={loading}
      />
      <CustomerDetailSection
        titleKey="customers.details.compliance.section.crs"
        rows={crs}
        loading={loading}
      />
      <CustomerDetailSection
        titleKey="customers.details.compliance.section.fatca"
        rows={fatca}
        loading={loading}
      />
    </div>
  );
}
