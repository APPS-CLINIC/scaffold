import { baseApi } from '@/api/baseApi';
import { mapCustomerAdvisorsResponse, mapCustomerDetailsResponse } from './customerDetails.adapter';
import type {
  CustomerAdvisors,
  CustomerAdvisorsResponse,
  CustomerDetails,
  CustomerDetailsResponse,
} from './customerDetails.types';

export function getCustomerDetailsRequest(customerId: string): { url: string } {
  return { url: `v1/customers/${encodeURIComponent(customerId)}` };
}

export function getCustomerAdvisorsRequest(customerId: string): { url: string } {
  return { url: `v1/customers/${encodeURIComponent(customerId)}/advisors` };
}

/** Detailed customer endpoints share the existing RTK Query transport/cache. */
export const customerDetailsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerDetails: builder.query<CustomerDetails, string>({
      query: getCustomerDetailsRequest,
      transformResponse: (response: CustomerDetailsResponse) =>
        mapCustomerDetailsResponse(response),
    }),
    getCustomerAdvisors: builder.query<CustomerAdvisors, string>({
      query: getCustomerAdvisorsRequest,
      transformResponse: (response: CustomerAdvisorsResponse) =>
        mapCustomerAdvisorsResponse(response),
    }),
  }),
});

export const { useGetCustomerAdvisorsQuery, useGetCustomerDetailsQuery } = customerDetailsApi;
