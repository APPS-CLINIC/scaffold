import { customerStatusByDomainValue, lookupDomainValue } from '../customers.adapter';
import type { CustomerSummary, CustomerSummaryResponse } from './customerSummary.types';

/** Keep transport vocabulary at the RTK Query boundary. */
export function mapCustomerSummaryResponse(response: CustomerSummaryResponse): CustomerSummary {
  return {
    ...response,
    status: lookupDomainValue(customerStatusByDomainValue, response.status),
  };
}

/** Stable fallback rendered while a customer's summary is unavailable (e.g. a failed request). */
export const EMPTY_CUSTOMER_SUMMARY: CustomerSummary = {
  fullName: '',
  grid: '',
  corporateGroupName: null,
  corporateGroupGrid: null,
  internalGroupName: null,
  pamLam: null,
  homeCountry: null,
  segmentColor: null,
  rating: null,
  status: null,
  kkf: null,
  pamName: null,
  lendingRatingDate: null,
  cddRiskLevel: null,
  cddExpirationDate: null,
};
