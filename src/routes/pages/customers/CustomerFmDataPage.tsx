import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CustomerFmDataView,
  DEFAULT_CUSTOMER_FM_DATA_PART,
  findCustomerFmDataPart,
} from '@/features/customers';
import { CustomerDetailFallbackPage } from './CustomerDetailFallbackPage';
import { useCustomerId } from './useCustomerId';

function fmDataPartPath(customerId: string, segment: string): string {
  return `/customers/${encodeURIComponent(customerId)}/fm-data/${segment}`;
}

/** Route content for the FM data tab; the splat segment selects the part being shown. */
export function CustomerFmDataPage() {
  const { t } = useTranslation();
  const id = useCustomerId();
  const navigate = useNavigate();
  const segment = useParams()['*'] ?? '';
  const part = findCustomerFmDataPart(segment);

  if (segment === '') {
    return <Navigate to={fmDataPartPath(id, DEFAULT_CUSTOMER_FM_DATA_PART.segment)} replace />;
  }

  if (!part) return <CustomerDetailFallbackPage />;

  return (
    <section aria-labelledby="customer-fm-data-title">
      <h2 id="customer-fm-data-title" className="sr-only">
        {t('nav.customerDetail.fmData')}
      </h2>
      <CustomerFmDataView
        customerId={id}
        part={part}
        onSelectPart={(selected) => navigate(fmDataPartPath(id, selected.segment))}
      />
    </section>
  );
}
