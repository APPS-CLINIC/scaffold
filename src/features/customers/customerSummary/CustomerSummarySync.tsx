import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { useGetCustomerSummaryQuery } from './customerSummary.api';
import { customerSummaryChanged, customerSummaryCleared } from './customerSummary.slice';

/**
 * No-UI bridge between RTK Query and the read-only mirror slice. RTK Query
 * owns the actual fetch, and this layout-level bridge is its only subscriber.
 * It stays mounted while nested tab routes change, so switching tabs never
 * refetches. Mounted once per customer identity (see `CustomerDetailLayout`,
 * which keys it by `customerId`), so:
 * - a new customer id clears the slice immediately (skeleton shows) and
 *   fills it in once that customer's query resolves;
 * - leaving the customer entirely unmounts this and clears the slice.
 */
export function CustomerSummarySync({ customerId }: { customerId: string }) {
  const dispatch = useAppDispatch();
  const { currentData, isError } = useGetCustomerSummaryQuery(customerId);

  useEffect(() => {
    if (isError) {
      dispatch(customerSummaryChanged({ customerId, status: 'failed' }));
    } else if (currentData !== undefined) {
      dispatch(customerSummaryChanged({ customerId, status: 'succeeded', data: currentData }));
    } else {
      dispatch(customerSummaryChanged({ customerId, status: 'loading' }));
    }
  }, [currentData, customerId, dispatch, isError]);

  useEffect(() => {
    return () => {
      dispatch(customerSummaryCleared({ customerId }));
    };
  }, [customerId, dispatch]);

  return null;
}
