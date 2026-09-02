import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CustomerSummaryPanel, CustomerSummarySync } from '@/features/customers/customerSummary';
import { resolveNavigation } from '@/routes/navigation';
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
  const { pathname } = useLocation();

  if (!id) return null;

  const navigation = resolveNavigation(pathname);
  const activeTab = navigation.route.activePath[0];
  // The dashboard owns a different header; remove this one condition if the
  // product later decides to show the shared master-data panel there too.
  const showsSummaryPanel = activeTab?.id !== 'dashboard';

  return (
    <section aria-label={t('customers.details.title')} className="w-full min-w-0 max-w-full">
      <CustomerSummarySync key={id} customerId={id} />
      <CustomerDetailHeading />
      {showsSummaryPanel ? (
        <div className="mt-4">
          <CustomerSummaryPanel customerId={id} />
        </div>
      ) : null}
      <div className="mt-6">
        <Outlet />
      </div>
    </section>
  );
}
