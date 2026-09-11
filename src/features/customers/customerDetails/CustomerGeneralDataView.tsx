import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyValueSections } from '@/ui';
import { useGetCustomerAdvisorsQuery, useGetCustomerDetailsQuery } from './customerDetails.api';
import { createGeneralDataSections } from './customerDetails.sections';

export interface CustomerGeneralDataViewProps {
  customerId: string;
}

/** Route content for the General data tab. */
export function CustomerGeneralDataView({ customerId }: CustomerGeneralDataViewProps) {
  const { t, i18n } = useTranslation();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const advisorsQuery = useGetCustomerAdvisorsQuery(customerId);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const sections = useMemo(
    () => createGeneralDataSections(detailsQuery.currentData, advisorsQuery.currentData, t, locale),
    [advisorsQuery.currentData, detailsQuery.currentData, locale, t],
  );
  const hasError = detailsQuery.isError || advisorsQuery.isError;

  return (
    <div className="min-w-0">
      {hasError ? (
        <p role="alert" className="sr-only">
          {t('customers.details.data.error')}
        </p>
      ) : null}
      <KeyValueSections
        sections={sections}
        headingLevel={3}
        emptyValue={t('customers.value.notAvailable')}
        loading={detailsQuery.isLoading || advisorsQuery.isLoading}
        aria-label={t('customers.details.generalData.ariaLabel')}
      />
    </div>
  );
}
