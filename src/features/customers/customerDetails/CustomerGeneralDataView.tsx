import { useTranslation } from 'react-i18next';
import { CustomerDetailSection, type CustomerFieldRow } from './CustomerFields';
import { EMPTY_CUSTOMER_ADVISORS, EMPTY_CUSTOMER_DETAILS } from './customerDetails.adapter';
import {
  isAwaitingData,
  useGetCustomerAdvisorsQuery,
  useGetCustomerDetailsQuery,
} from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';

export interface CustomerGeneralDataViewProps {
  customerId: string;
}

/** Route content for the General data tab. Section and row order follow the design. */
export function CustomerGeneralDataView({ customerId }: CustomerGeneralDataViewProps) {
  const { t } = useTranslation();
  const format = useCustomerFormatters();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const advisorsQuery = useGetCustomerAdvisorsQuery(customerId);
  const details = detailsQuery.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const advisors = advisorsQuery.currentData ?? EMPTY_CUSTOMER_ADVISORS;
  const loading = isAwaitingData(detailsQuery) || isAwaitingData(advisorsQuery);

  const basic: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.generalData.field.catalogOpenDate',
      value: format.date(details.basicData.catalogOpenDate),
    },
    { labelKey: 'customers.details.generalData.field.taxId', value: details.basicData.taxId },
    { labelKey: 'customers.details.generalData.field.regon', value: details.basicData.regon },
    { labelKey: 'customers.details.generalData.field.krs', value: details.basicData.krs },
    {
      labelKey: 'customers.details.generalData.field.residenceCountry',
      value: details.basicData.residenceCountry,
    },
    {
      labelKey: 'customers.details.generalData.field.registrationCountry',
      value: details.basicData.registrationCountry,
    },
    {
      labelKey: 'customers.details.generalData.field.customerType',
      value: details.basicData.customerType,
    },
    { labelKey: 'customers.details.generalData.field.sector', value: details.basicData.sector },
    {
      labelKey: 'customers.details.generalData.field.subSector',
      value: details.basicData.subSector,
    },
    {
      labelKey: 'customers.details.generalData.field.nbpEntityType',
      value: details.basicData.nbpEntityType,
    },
    {
      labelKey: 'customers.details.generalData.field.nbpEntityTypeDescription',
      value: details.basicData.nbpEntityTypeDescription,
    },
    {
      labelKey: 'customers.details.generalData.field.mifidClassification',
      value: details.mifid.mifidClassification,
    },
    { labelKey: 'customers.details.generalData.field.leiCode', value: details.lei.leiCode },
    {
      labelKey: 'customers.details.generalData.field.leiCodeValidityDate',
      value: format.date(details.lei.leiCodeValidityDate),
    },
    {
      labelKey: 'customers.details.generalData.field.emirClassification',
      value: details.emir.emirClassification,
    },
    {
      labelKey: 'customers.details.generalData.field.naicsCode',
      value: details.basicData.naicsCode,
    },
    {
      labelKey: 'customers.details.generalData.field.naicsName',
      value: details.basicData.naicsName,
    },
  ];

  const addresses: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.generalData.field.mainAddress',
      value: format.address(details.addresses.mainAddress),
    },
    {
      labelKey: 'customers.details.generalData.field.mailingAddress',
      value: format.address(details.addresses.mailingAddress),
    },
  ];

  const advisorRows: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.generalData.field.rmAdvisor', value: advisors.rmAdvisor },
    {
      labelKey: 'customers.details.generalData.field.lendingAdvisor',
      value: advisors.lendingAdvisor,
    },
    { labelKey: 'customers.details.generalData.field.sfAdvisor', value: advisors.sfAdvisor },
    { labelKey: 'customers.details.generalData.field.pcmAdvisor', value: advisors.pcmAdvisor },
    { labelKey: 'customers.details.generalData.field.fmAdvisor', value: advisors.fmAdvisor },
    { labelKey: 'customers.details.generalData.field.tsAdvisor', value: advisors.tsAdvisor },
    { labelKey: 'customers.details.generalData.field.ebdAdvisor', value: advisors.ebdAdvisor },
    {
      labelKey: 'customers.details.generalData.field.implementationAdvisor',
      value: advisors.implementationAdvisor,
    },
    {
      labelKey: 'customers.details.generalData.field.customerServiceAdvisor',
      value: advisors.customerServiceAdvisor,
    },
  ];

  const consents: readonly CustomerFieldRow[] = [
    {
      labelKey: 'customers.details.generalData.field.electronicBskMarketingConsent',
      value: format.yesNo(details.consents.electronicBskMarketingConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.nvTransferConsent',
      value: format.yesNo(details.consents.nvTransferConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.bskTransferConsent',
      value: format.yesNo(details.consents.bskTransferConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.traditionalBskMarketingConsent',
      value: format.yesNo(details.consents.traditionalBskMarketingConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.udbTransferConsent',
      value: format.yesNo(details.consents.udbTransferConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.fromIngLeaseConsent',
      value: format.yesNo(details.consents.fromIngLeaseConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.toIngLeaseConsent',
      value: format.yesNo(details.consents.toIngLeaseConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.fromCommercialFinanceConsent',
      value: format.yesNo(details.consents.fromCommercialFinanceConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.toCommercialFinanceConsent',
      value: format.yesNo(details.consents.toCommercialFinanceConsent),
    },
    {
      labelKey: 'customers.details.generalData.field.outsideBankConsent',
      value: format.yesNo(details.consents.outsideBankConsent),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t('customers.details.generalData.ariaLabel')}
      aria-busy={loading || undefined}
      className="min-w-0 space-y-4"
    >
      {detailsQuery.isError || advisorsQuery.isError ? (
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
