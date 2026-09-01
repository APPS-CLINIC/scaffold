import type { RootState } from '@/app/rootReducer';
import type { CustomerSummary, CustomerSummaryLoadStatus } from './customerSummary.types';

/** Never expose data that belongs to a previous customer identity. */
export const selectCustomerSummary = (
  state: RootState,
  customerId: string,
): CustomerSummary | null =>
  state.customerSummary.customerId === customerId ? state.customerSummary.data : null;

/**
 * A not-yet-mirrored requested identity is loading from a view's perspective.
 * This keeps the first render after an id change in the reserved skeleton state.
 */
export const selectCustomerSummaryStatus = (
  state: RootState,
  customerId: string,
): CustomerSummaryLoadStatus =>
  state.customerSummary.customerId === customerId ? state.customerSummary.status : 'loading';

export const selectCustomerSummaryCustomerId = (state: RootState) =>
  state.customerSummary.customerId;
