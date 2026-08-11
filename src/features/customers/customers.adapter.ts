import {
  customerStatusByDomainValue,
  normalizeDomainValue,
  priceConditionStatusByDomainValue,
} from '@/i18n/domainValues';
import type {
  Customer,
  CustomerPriceConditionStatus,
  CustomerResponse,
  CustomerStatus,
} from './customers.types';

function normalizeCustomerStatus(value: string): CustomerStatus | null {
  return customerStatusByDomainValue[normalizeDomainValue(value)] ?? null;
}

function normalizePriceConditionStatus(value: string | null): CustomerPriceConditionStatus | null {
  if (value === null) return null;
  return priceConditionStatusByDomainValue[normalizeDomainValue(value)] ?? null;
}

/** Keep transport vocabulary at the RTK Query boundary. */
export function mapCustomerResponse(response: CustomerResponse): Customer {
  return {
    ...response,
    status: normalizeCustomerStatus(response.status),
    tsPriceConditionStatus: normalizePriceConditionStatus(response.tsPriceConditionStatus),
  };
}
