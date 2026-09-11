import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetCustomerSummaryQuery } from '@/features/customers';
import { CustomerDetailHeading } from './CustomerDetailHeading';
import { useCustomerId } from './useCustomerId';

/**
 * Layout route for `/customers/:id/*`. Holds the summary subscription for the whole customer
 * visit: tab switches (incl. the dashboard, which has no panel) never refetch; `keepUnusedDataFor:
 * 0` evicts the entry when this unmounts or `id` changes. Selects nothing so cache transitions
 * never re-render the heading and the tab subtree — the panel and the CDD view subscribe for the
 * data themselves.
 */
export function CustomerDetailLayout() {
  const { t } = useTranslation();
  const id = useCustomerId();

  useGetCustomerSummaryQuery(id, { selectFromResult: () => ({}) });

  return (
    <section aria-label={t('customers.details.title')} className="w-full min-w-0 max-w-full">
      <CustomerDetailHeading />
      <Outlet />
    </section>
  );
}
