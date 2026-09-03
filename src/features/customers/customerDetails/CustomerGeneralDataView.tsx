import { useTranslation } from 'react-i18next';
import { CustomerDetailSection, type CustomerFieldRow } from './CustomerFields';
import { EMPTY_CUSTOMER_ADVISORS, EMPTY_CUSTOMER_DETAILS } from './customerDetails.adapter';
import { useGetCustomerAdvisorsQuery, useGetCustomerDetailsQuery } from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';

export interface CustomerGeneralDataViewProps {
  customerId: string;
}

/** Route content for the General data tab: 4 sections, 38 rows, design order preserved. */
export function CustomerGeneralDataView({ customerId }: CustomerGeneralDataViewProps) {
  const { t } = useTranslation();
  const f = useCustomerFormatters();
  const details = useGetCustomerDetailsQuery(customerId);
  const advisors = useGetCustomerAdvisorsQuery(customerId);
  const d = details.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const a = advisors.currentData ?? EMPTY_CUSTOMER_ADVISORS;
  const loading =
    (!details.isError && details.currentData === undefined) ||
    (!advisors.isError && advisors.currentData === undefined);

  const basic: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.generalData.field.catalogOpenDate',
      value: f.date(d.basicData.catalogOpenDate),
    },
    { labelKey: 'customers.details.generalData.field.taxId', value: d.basicData.taxId },
    { labelKey: 'customers.details.generalData.field.regon', value: d.basicData.regon },
    { labelKey: 'customers.details.generalData.field.krs', value: d.basicData.krs },
    {
      labelKey: 'customers.details.generalData.field.residenceCountry',
      value: d.basicData.residenceCountry,
    },
    {
      labelKey: 'customers.details.generalData.field.registrationCountry',
      value: d.basicData.registrationCountry,
    },
    {
      labelKey: 'customers.details.generalData.field.customerType',
      value: d.basicData.customerType,
    },
    { labelKey: 'customers.details.generalData.field.sector', value: d.basicData.sector },
    { labelKey: 'customers.details.generalData.field.subSector', value: d.basicData.subSector },
    {
      labelKey: 'customers.details.generalData.field.nbpEntityType',
      value: d.basicData.nbpEntityType,
    },
    {
      labelKey: 'customers.details.generalData.field.nbpEntityTypeDescription',
      value: d.basicData.nbpEntityTypeDescription,
    },
    {
      labelKey: 'customers.details.generalData.field.mifidClassification',
      value: d.mifid.mifidClassification,
    },
    { labelKey: 'customers.details.generalData.field.leiCode', value: d.lei.leiCode },
    {
      labelKey: 'customers.details.generalData.field.leiCodeValidityDate',
      value: f.date(d.lei.leiCodeValidityDate),
    },
    {
      labelKey: 'customers.details.generalData.field.emirClassification',
      value: d.emir.emirClassification,
    },
    { labelKey: 'customers.details.generalData.field.naicsCode', value: d.basicData.naicsCode },
    { labelKey: 'customers.details.generalData.field.naicsName', value: d.basicData.naicsName },
  ];

  const addresses: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.generalData.field.mainAddress',
      value: f.address(d.addresses.mainAddress),
    },
    {
      labelKey: 'customers.details.generalData.field.mailingAddress',
      value: f.address(d.addresses.mailingAddress),
    },
  ];

  const advisorRows: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.generalData.field.rmAdvisor', value: a.rmAdvisor },
    { labelKey: 'customers.details.generalData.field.lendingAdvisor', value: a.lendingAdvisor },
    { labelKey: 'customers.details.generalData.field.sfAdvisor', value: a.sfAdvisor },
    { labelKey: 'customers.details.generalData.field.pcmAdvisor', value: a.pcmAdvisor },
    { labelKey: 'customers.details.generalData.field.fmAdvisor', value: a.fmAdvisor },
    { labelKey: 'customers.details.generalData.field.tsAdvisor', value: a.tsAdvisor },
    { labelKey: 'customers.details.generalData.field.ebdAdvisor', value: a.ebdAdvisor },
    {
      labelKey: 'customers.details.generalData.field.implementationAdvisor',
      value: a.implementationAdvisor,
    },
    {
      labelKey: 'customers.details.generalData.field.customerServiceAdvisor',
      value: a.customerServiceAdvisor,
    },
  ];

  const consents: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.generalData.field.electronicBskMarketingConsent',
      value: f.yesNo(d.consents.electronicBskMarketingConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.nvTransferConsent',
      value: f.yesNo(d.consents.nvTransferConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.bskTransferConsent',
      value: f.yesNo(d.consents.bskTransferConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.traditionalBskMarketingConsent',
      value: f.yesNo(d.consents.traditionalBskMarketingConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.udbTransferConsent',
      value: f.yesNo(d.consents.udbTransferConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.fromIngLeaseConsent',
      value: f.yesNo(d.consents.fromIngLeaseConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.toIngLeaseConsent',
      value: f.yesNo(d.consents.toIngLeaseConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.fromCommercialFinanceConsent',
      value: f.yesNo(d.consents.fromCommercialFinanceConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.toCommercialFinanceConsent',
      value: f.yesNo(d.consents.toCommercialFinanceConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.outsideBankConsent',
      value: f.yesNo(d.consents.outsideBankConsent),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t('customers.details.generalData.ariaLabel')}
      aria-busy={loading || undefined}
      className="min-w-0 space-y-4"
    >
      {details.isError || advisors.isError ? (
        <p role="alert" className="sr-only">
          {t('customers.details.data.error')}
        </p>
      ) : null}
      <CustomerDetailSection
        titleKey="customers.details.generalData.section.basic"
        rows={basic}
        loading={loading}
      />
      <CustomerDetailSection
        titleKey="customers.details.generalData.section.addresses"
        rows={addresses}
        loading={loading}
      />
      <CustomerDetailSection
        titleKey="customers.details.generalData.section.advisors"
        rows={advisorRows}
        loading={loading}
      />
      <CustomerDetailSection
        titleKey="customers.details.generalData.section.consents"
        rows={consents}
        loading={loading}
      />
    </div>
  );
}
