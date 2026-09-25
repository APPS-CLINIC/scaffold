import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { DEFAULT_DUE_DATE_FILTER, filterByDueDate, type DueDateFilterValue } from '@/ui';
import { CustomerDataAsOf } from './CustomerDataAsOf';
import {
  CustomerFieldGroups,
  type CustomerFieldGroup,
  type CustomerFieldValue,
} from './CustomerFields';
import { EMPTY_CUSTOMER_DETAILS } from './customerDetails.adapter';
import { isAwaitingData, useGetCustomerDetailsQuery } from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';

export interface CustomerReviewDatesProps {
  customerId: string;
  dueDateFilter: DueDateFilterValue;
}

/** A row with the raw date it is filtered by; a row that is not a date has none. */
interface ReviewDateRow {
  labelKey: MessageKey;
  date: string | null;
  value: CustomerFieldValue;
}

/**
 * The "Review dates" part of the reviews section. The due-date filter waits for the first
 * details: while none have arrived — still loading, or the first request failed — every row
 * stays in place.
 */
export function CustomerReviewDates({ customerId, dueDateFilter }: CustomerReviewDatesProps) {
  const { t } = useTranslation();
  const format = useCustomerFormatters();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const details = detailsQuery.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const loading = isAwaitingData(detailsQuery);
  const filter = detailsQuery.currentData ? dueDateFilter : DEFAULT_DUE_DATE_FILTER;

  const dated = (labelKey: MessageKey, date: string | null): ReviewDateRow => ({
    labelKey,
    date,
    value: format.reviewDate(date),
  });

  const rowGroups: readonly (readonly ReviewDateRow[])[] = [
    [
      dated('customers.details.reviews.field.lendingReviewDate', details.lending.lendingReviewDate),
      dated(
        'customers.details.reviews.field.reviewExtensionDate',
        details.basicData.reviewExtensionDate,
      ),
      dated(
        'customers.details.reviews.field.lendingRatingReviewDate',
        details.lending.lendingRatingReviewDate,
      ),
      dated('customers.details.reviews.field.cddExpirationDate', details.cdd.cddExpirationDate),
      dated('customers.details.reviews.field.fatcaReviewDate', details.fatca.fatcaReviewDate),
    ],
    [
      {
        labelKey: 'customers.details.reviews.field.tsPriceConditionStatus',
        date: null,
        value: details.tsPrice.tsPriceConditionStatus,
      },
      dated(
        'customers.details.reviews.field.tsPriceConditionEndDate',
        details.tsPrice.tsPriceConditionEndDate,
      ),
    ],
  ];

  const groups: readonly CustomerFieldGroup[] = rowGroups
    .map((rows) => ({
      rows: filterByDueDate(rows, (row) => row.date, filter).map(({ labelKey, value }) => ({
        labelKey,
        value,
      })),
    }))
    .filter((group) => group.rows.length > 0);

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
      {groups.length > 0 ? <CustomerFieldGroups groups={groups} loading={loading} /> : null}
      {/* Kept in place so assistive technology announces the message when a filter empties it. */}
      <p
        role="status"
        className={groups.length > 0 ? 'sr-only' : 'm-0 mt-2 text-sm text-[var(--muted)]'}
      >
        {groups.length > 0 ? null : t('customers.details.reviews.noDatesInRange')}
      </p>
    </div>
  );
}
