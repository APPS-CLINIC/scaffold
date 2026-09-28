import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { ALL_DUE_DATES, filterByDueDate, type DueDateSelection } from '@/ui';
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
  dueDateWindows: DueDateSelection;
}

/** A row with the raw date it is filtered by; a row that is not a date has none. */
interface ReviewDateRow {
  labelKey: MessageKey;
  date: string | null;
  value: CustomerFieldValue;
}

/**
 * The "Review dates" part of the reviews section. While the details load, every row keeps its
 * skeleton; otherwise chosen due-date windows hide every row without a date in one of them,
 * including the empty ones a failed request leaves.
 */
export function CustomerReviewDates({ customerId, dueDateWindows }: CustomerReviewDatesProps) {
  const { t } = useTranslation();
  const format = useCustomerFormatters();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const details = detailsQuery.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const loading = isAwaitingData(detailsQuery);
  const windows = loading ? ALL_DUE_DATES : dueDateWindows;

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
      rows: filterByDueDate(rows, (row) => row.date, windows).map(({ labelKey, value }) => ({
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
