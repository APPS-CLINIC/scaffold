import { Outlet, useParams } from 'react-router-dom';
import { CustomerSummaryPanel } from '@/features/customers/customerSummary';

/** Persistent panel shell shared by customer pages that display master data. */
export function CustomerSummaryLayout() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <>
      <div className="mt-4">
        <CustomerSummaryPanel customerId={id} />
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </>
  );
}
