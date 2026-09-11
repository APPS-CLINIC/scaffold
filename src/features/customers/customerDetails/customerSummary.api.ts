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
      // RTK Query is the only cache: never keep a customer's summary around once
      // the layout's subscription leaves, so switching/leaving evicts it immediately.
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetCustomerSummaryQuery } = customerSummaryApi;
