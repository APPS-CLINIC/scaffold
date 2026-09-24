import { useTranslation } from 'react-i18next';
import { CustomerDataAsOf } from './CustomerDataAsOf';
import { CustomerFieldGroups, type CustomerFieldGroup } from './CustomerFields';
import { EMPTY_CUSTOMER_DETAILS } from './customerDetails.adapter';
import { isAwaitingData, useGetCustomerDetailsQuery } from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';

export interface CustomerReviewDatesProps {
  customerId: string;
}

/** The "Review dates" part of the reviews section. */
export function CustomerReviewDates({ customerId }: CustomerReviewDatesProps) {
  const { t } = useTranslation();
  const format = useCustomerFormatters();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const details = detailsQuery.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const loading = isAwaitingData(detailsQuery);

  const groups: readonly CustomerFieldGroup[] = [
    {
      rows: [
        {
          labelKey: 'customers.details.reviews.field.lendingReviewDate',
          value: format.reviewDate(details.lending.lendingReviewDate),
        },
        {
          labelKey: 'customers.details.reviews.field.reviewExtensionDate',
          value: format.reviewDate(details.basicData.reviewExtensionDate),
        },
        {
          labelKey: 'customers.details.reviews.field.lendingRatingReviewDate',
          value: format.reviewDate(details.lending.lendingRatingReviewDate),
        },
        {
          labelKey: 'customers.details.reviews.field.cddExpirationDate',
          value: format.reviewDate(details.cdd.cddExpirationDate),
        },
        {
          labelKey: 'customers.details.reviews.field.fatcaReviewDate',
          value: format.reviewDate(details.fatca.fatcaReviewDate),
        },
      ],
    },
    {
      rows: [
        {
          labelKey: 'customers.details.reviews.field.tsPriceConditionStatus',
          value: details.tsPrice.tsPriceConditionStatus,
        },
        {
          labelKey: 'customers.details.reviews.field.tsPriceConditionEndDate',
          value: format.reviewDate(details.tsPrice.tsPriceConditionEndDate),
        },
      ],
    },
  ];

  return (
    <div className="mt-2 min-w-0" aria-busy={loading || undefined}>
      {detailsQuery.isError ? (
        <p role="alert" className="sr-only">
          {t('customers.details.data.error')}
        </p>
      ) : null}
      <CustomerDataAsOf
        fulfilledTimeStamp={detailsQuery.fulfilledTimeStamp}
        onRefresh={detailsQuery.refetch}
      />
      <CustomerFieldGroups groups={groups} loading={loading} layout="balanced" />
    </div>
  );
}
