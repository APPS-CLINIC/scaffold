import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cx, DEFAULT_DUE_DATE_FILTER, DueDateFilter, type DueDateFilterValue } from '@/ui';
import { CustomerPartsCard } from './CustomerPartsCard';
import { CustomerReviewDates } from './CustomerReviewDates';
import {
  CUSTOMER_REVIEWS_PARTS,
  DEFAULT_CUSTOMER_REVIEWS_PART,
  type CustomerReviewsPart,
} from './customerReviews.parts';

export interface CustomerReviewsViewProps {
  customerId: string;
  part: CustomerReviewsPart;
  onSelectPart: (part: CustomerReviewsPart) => void;
}

/**
 * Route content for the reviews tab: one card holding the part menu and the active part. The
 * review dates part adds the due-date filter above its heading.
 */
export function CustomerReviewsView({ customerId, part, onSelectPart }: CustomerReviewsViewProps) {
  const { t } = useTranslation();
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilterValue>(DEFAULT_DUE_DATE_FILTER);
  const showsReviewDates = part.id === DEFAULT_CUSTOMER_REVIEWS_PART.id;

  return (
    <CustomerPartsCard
      groupLabelKey="customers.details.reviews.ariaLabel"
      menuLabelKey="customers.details.reviews.menuAriaLabel"
      parts={CUSTOMER_REVIEWS_PARTS}
      activePart={part}
      onSelectPart={onSelectPart}
    >
      {showsReviewDates ? (
        <DueDateFilter value={dueDateFilter} onChange={setDueDateFilter} className="pt-5" />
      ) : null}
      <h3
        className={cx(
          'm-0 text-base font-bold leading-6 text-[var(--text)]',
          showsReviewDates && 'mt-8',
        )}
      >
        {t(part.labelKey)}
      </h3>
      {showsReviewDates ? (
        <CustomerReviewDates customerId={customerId} dueDateFilter={dueDateFilter} />
      ) : (
        <p className="mt-2 text-[var(--muted)]">{t('section.placeholder')}</p>
      )}
    </CustomerPartsCard>
  );
}
