import type { CustomerSectionPart } from './CustomerPartsCard';

export type CustomerReviewsPart = CustomerSectionPart;

/**
 * Parts of the reviews section, in menu order. They are not navigation-manifest items: the menu
 * lives inside the page, below the customer sidebar item it belongs to. The segment is the last
 * URL segment, so a part survives a reload and a shared link.
 */
export const CUSTOMER_REVIEWS_PARTS = [
  {
    id: 'review-dates',
    segment: 'review-dates',
    labelKey: 'customers.details.reviews.part.reviewDates',
  },
  {
    id: 'facilities',
    segment: 'facilities',
    labelKey: 'customers.details.reviews.part.facilities',
  },
  {
    id: 'collaterals',
    segment: 'collaterals',
    labelKey: 'customers.details.reviews.part.collaterals',
  },
] as const satisfies readonly CustomerReviewsPart[];

export const DEFAULT_CUSTOMER_REVIEWS_PART = CUSTOMER_REVIEWS_PARTS[0];

export function findCustomerReviewsPart(segment: string): CustomerReviewsPart | undefined {
  return CUSTOMER_REVIEWS_PARTS.find((part) => part.segment === segment);
}
