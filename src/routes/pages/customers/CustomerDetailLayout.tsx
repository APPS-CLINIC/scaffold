import { Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CustomerSummarySync } from '@/features/customers/customerSummary';
import { CustomerDetailHeading } from './CustomerDetailHeading';

/**
 * Layout route for `/customers/{id}/...`. Mounted once per customer identity
 * (keyed by `id` below) and stays mounted across tab switches — only
 * `<Outlet/>`'s content changes — so the summary fetch/clear happens exactly
 * on entering/leaving a customer, never on a tab click (req #9, #18, #25).
 */
export function CustomerDetailLayout() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <section aria-label={t('customers.details.title')} className="w-full min-w-0 max-w-full">
      <CustomerSummarySync key={id} customerId={id} />
      <CustomerDetailHeading />
      <Outlet />
    </section>
  );
}
