import { useTranslation } from 'react-i18next';
import { CustomerDetailSection, type CustomerFieldRow } from './CustomerFields';
import { EMPTY_CUSTOMER_DETAILS } from './customerDetails.adapter';
import { useGetCustomerDetailsQuery } from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';
import { useGetCustomerSummaryQuery } from './customerSummary.api';

export interface CustomerCddCrsFatcaViewProps {
  customerId: string;
}

/**
 * Design rows whose backend field is not confirmed yet (Swagger photo cut off,
 * customerDetails.types.ts:72-79). They render the shared "not available" dash on purpose.
 * `grep NOT_MAPPED` lists every one; delete this constant when the last binding lands.
 */
const NOT_MAPPED = null;

/**
 * Route content for the CDD/CRS/FATCA tab. Three cards, 25 rows (15 NOT_MAPPED), design order
 * preserved: CDD carries the "Data ICBS" and "Scope file data" groups behind one divider.
 */
export function CustomerCddCrsFatcaView({ customerId }: CustomerCddCrsFatcaViewProps) {
  const { t } = useTranslation();
  const f = useCustomerFormatters();
  const details = useGetCustomerDetailsQuery(customerId);
  const summary = useGetCustomerSummaryQuery(customerId); // subscriber #2 of the layout's cache entry
  const d = details.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const s = summary.currentData;
  const loading =
    (!details.isError && details.currentData === undefined) ||
    (!summary.isError && s === undefined);

  const dataIcbs: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.compliance.field.cddDate', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddRiskLevel', value: s?.cddRiskLevel },
    {
      labelKey: 'customers.details.compliance.field.cddExpirationDate',
      value: f.expiry(s?.cddExpirationDate ?? null),
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
    { labelKey: 'customers.details.compliance.field.crsProcessType', value: d.crs.crsProcessType },
    {
      labelKey: 'customers.details.compliance.field.crsReviewDate',
      value: f.date(d.crs.crsReviewDate),
    },
    { labelKey: 'customers.details.compliance.field.crsStatus', value: d.crs.crsStatus },
    {
      labelKey: 'customers.details.compliance.field.crsClassificationDate',
      value: f.date(d.crs.crsClassificationDate),
    },
  ];

  const fatca: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.compliance.field.fatcaReviewType',
      value: d.fatca.fatcaReviewType,
    },
    {
      labelKey: 'customers.details.compliance.field.fatcaReviewDate',
      value: f.expiry(d.fatca.fatcaReviewDate),
    },
    { labelKey: 'customers.details.compliance.field.fatcaStatus', value: d.fatca.fatcaStatus },
    {
      labelKey: 'customers.details.compliance.field.fatcaClassificationDate',
      value: f.date(d.fatca.fatcaClassificationDate),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t('customers.details.compliance.ariaLabel')}
      aria-busy={loading || undefined}
      className="min-w-0 space-y-4"
    >
      {details.isError || summary.isError ? (
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
