import { useTranslation } from 'react-i18next';
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

/** Route content for the reviews tab: one card holding the part menu and the active part. */
export function CustomerReviewsView({ customerId, part, onSelectPart }: CustomerReviewsViewProps) {
  const { t } = useTranslation();

  return (
    <CustomerPartsCard
      groupLabelKey="customers.details.reviews.ariaLabel"
      menuLabelKey="customers.details.reviews.menuAriaLabel"
      parts={CUSTOMER_REVIEWS_PARTS}
      activePart={part}
      onSelectPart={onSelectPart}
    >
      <h3 className="m-0 text-base font-bold leading-6 text-[var(--text)]">{t(part.labelKey)}</h3>
      {part.id === DEFAULT_CUSTOMER_REVIEWS_PART.id ? (
        <CustomerReviewDates customerId={customerId} />
      ) : (
        <p className="mt-2 text-[var(--muted)]">{t('section.placeholder')}</p>
      )}
    </CustomerPartsCard>
  );
}
