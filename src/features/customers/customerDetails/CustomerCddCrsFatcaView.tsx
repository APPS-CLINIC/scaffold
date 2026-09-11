import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { KeyValueSections } from '@/ui';
import { selectCustomerSummary, selectCustomerSummaryStatus } from '../customerSummary';
import { useGetCustomerDetailsQuery } from './customerDetails.api';
import { createComplianceSections } from './customerDetails.sections';

export interface CustomerCddCrsFatcaViewProps {
  customerId: string;
}

/** Route content for the compliance tab, sharing the same configured renderer. */
export function CustomerCddCrsFatcaView({ customerId }: CustomerCddCrsFatcaViewProps) {
  const { t, i18n } = useTranslation();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const summary = useAppSelector((state) => selectCustomerSummary(state, customerId));
  const summaryStatus = useAppSelector((state) => selectCustomerSummaryStatus(state, customerId));
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const sections = useMemo(
    () => createComplianceSections(detailsQuery.currentData, summary, t, locale),
    [detailsQuery.currentData, locale, summary, t],
  );
  const summaryLoading = summaryStatus === 'idle' || summaryStatus === 'loading';
  const hasError = detailsQuery.isError || summaryStatus === 'failed';

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
        loading={detailsQuery.isLoading || summaryLoading}
        aria-label={t('customers.details.compliance.ariaLabel')}
      />
    </div>
  );
}
