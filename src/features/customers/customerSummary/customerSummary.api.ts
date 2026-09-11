import { baseApi } from '@/api/baseApi';
import { mapCustomerSummaryResponse } from './customerSummary.adapter';
import type { CustomerSummary, CustomerSummaryResponse } from './customerSummary.types';

export function getCustomerSummaryRequest(customerId: string): { url: string } {
  return { url: `v1/customers/${encodeURIComponent(customerId)}/summary` };
}

export const customerSummaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerSummary: builder.query<CustomerSummary, string>({
      query: getCustomerSummaryRequest,
      transformResponse: (response: CustomerSummaryResponse) =>
        mapCustomerSummaryResponse(response),
      providesTags: (_result, _error, customerId) => [{ type: 'CustomerSummary', id: customerId }],
      // The mirror slice intentionally holds at most the active customer.
      // Remove the transport cache as soon as the layout subscription leaves.
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetCustomerSummaryQuery } = customerSummaryApi;
