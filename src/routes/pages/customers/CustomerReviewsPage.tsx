import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CustomerReviewsView,
  DEFAULT_CUSTOMER_REVIEWS_PART,
  findCustomerReviewsPart,
} from '@/features/customers';
import { CustomerDetailFallbackPage } from './CustomerDetailFallbackPage';
import { useCustomerId } from './useCustomerId';

function reviewsPartPath(customerId: string, segment: string): string {
  return `/customers/${encodeURIComponent(customerId)}/reviews/${segment}`;
}

/** Route content for the reviews tab; the splat segment selects the part being shown. */
export function CustomerReviewsPage() {
  const { t } = useTranslation();
  const id = useCustomerId();
  const navigate = useNavigate();
  const segment = useParams()['*'] ?? '';
  const part = findCustomerReviewsPart(segment);

  if (segment === '') {
    return <Navigate to={reviewsPartPath(id, DEFAULT_CUSTOMER_REVIEWS_PART.segment)} replace />;
  }

  if (!part) return <CustomerDetailFallbackPage />;

  return (
    <section aria-labelledby="customer-reviews-title">
      <h2 id="customer-reviews-title" className="sr-only">
        {t('nav.customerDetail.reviews')}
      </h2>
      <CustomerReviewsView
        customerId={id}
        part={part}
        onSelectPart={(selected) => navigate(reviewsPartPath(id, selected.segment))}
      />
    </section>
  );
}
