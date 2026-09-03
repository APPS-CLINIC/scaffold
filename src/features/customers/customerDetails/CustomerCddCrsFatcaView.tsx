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

/** Route content for the CDD/CRS/FATCA tab: 4 sections, 25 rows (15 NOT_MAPPED), design order preserved. */
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

  const cdd: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.compliance.field.cddDate', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddRiskLevel', value: s?.cddRiskLevel },
    {
      labelKey: 'customers.details.compliance.field.cddExpirationDate',
      value: f.expiry(s?.cddExpirationDate ?? null),
    },
    { labelKey: 'customers.details.compliance.field.cddAssessmentDate', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddRiskLevelVintage', value: NOT_MAPPED },
    {
      labelKey: 'customers.details.compliance.field.cddExpirationDateVintage',
      value: NOT_MAPPED,
    },
    { labelKey: 'customers.details.compliance.field.cddOwner', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddFirstGeneration', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.cddSecondGeneration', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.mlrdDeviationFrom', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.mlrdDeviationTo', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.mlrdDeviationFlag', value: NOT_MAPPED },
  ];

  const segmentation: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.compliance.field.segmentationGroup', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.segmentationCluster', value: NOT_MAPPED },
    { labelKey: 'customers.details.compliance.field.segmentationSprint', value: NOT_MAPPED },
    {
      labelKey: 'customers.details.compliance.field.segmentationSprintStartDate',
      value: NOT_MAPPED,
    },
    {
      labelKey: 'customers.details.compliance.field.segmentationSprintEndDate',
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
        rows={cdd}
        loading={loading}
      />
      <CustomerDetailSection
        titleKey="customers.details.compliance.section.segmentation"
        rows={segmentation}
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
