import { customerStatusByDomainValue, lookupDomainValue } from '../customers.adapter';
import type { CustomerSummary, CustomerSummaryResponse } from './customerSummary.types';

/** Keep transport vocabulary at the RTK Query boundary. */
export function mapCustomerSummaryResponse(response: CustomerSummaryResponse): CustomerSummary {
  return {
    ...response,
    status: lookupDomainValue(customerStatusByDomainValue, response.status),
  };
}
