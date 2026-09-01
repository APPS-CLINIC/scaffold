import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CustomerSummary, CustomerSummaryLoadStatus } from './customerSummary.types';

/**
 * Read-only mirror of the fetched customer summary inside Redux.
 *
 * RTK Query (`customerSummaryApi`) is the only thing that ever talks to the
 * backend and owns the HTTP cache/dedup — this slice never fetches anything
 * itself, so it can never become a second, independently-fetched cache.
 * `CustomerSummarySync` is the single writer: it clears this slice whenever
 * the customer identity changes (and on unmount, i.e. leaving the customer),
 * then fills it in once the query for that customer resolves. See ADR 0029.
 */
export interface CustomerSummaryState {
  customerId: string | null;
  data: CustomerSummary | null;
  status: CustomerSummaryLoadStatus;
}

const initialState: CustomerSummaryState = {
  customerId: null,
  data: null,
  status: 'idle',
};

type CustomerSummaryChangedPayload =
  | { customerId: string; status: 'loading' }
  | { customerId: string; status: 'succeeded'; data: CustomerSummary }
  | { customerId: string; status: 'failed' };

const customerSummarySlice = createSlice({
  name: 'customerSummary',
  initialState,
  reducers: {
    customerSummaryChanged(state, action: PayloadAction<CustomerSummaryChangedPayload>) {
      const { customerId, status } = action.payload;

      if (status === 'loading') {
        state.customerId = customerId;
        state.data = null;
        state.status = status;
        return;
      }

      // A response from a subscription that is no longer active must never
      // replace the current customer's mirror.
      if (state.customerId !== customerId) return;

      state.status = status;
      state.data = status === 'succeeded' ? action.payload.data : null;
    },
    customerSummaryCleared(state, action: PayloadAction<{ customerId: string }>) {
      // Effect cleanup can run after a new customer has already been selected.
      // Scope cleanup to its own identity so it cannot erase the new mirror.
      if (state.customerId === action.payload.customerId) return initialState;
    },
  },
});

export const { customerSummaryChanged, customerSummaryCleared } = customerSummarySlice.actions;
export const customerSummaryReducer = customerSummarySlice.reducer;
