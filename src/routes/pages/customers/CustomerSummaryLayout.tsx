import { Outlet } from 'react-router-dom';
import { CustomerSummaryPanel } from '@/features/customers';
import { useCustomerId } from './useCustomerId';

/** Persistent panel shell shared by customer pages that display master data. */
export function CustomerSummaryLayout() {
  const id = useCustomerId();

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
