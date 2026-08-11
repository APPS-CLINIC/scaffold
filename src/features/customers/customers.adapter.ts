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

/** Own-property lookup: backend labels like "constructor" must not resolve via Object.prototype. */
function lookupDomainValue<V extends string>(
  vocabulary: Readonly<Record<string, V>>,
  rawValue: string,
): V | null {
  const key = normalizeDomainValue(rawValue);
  return Object.hasOwn(vocabulary, key) ? (vocabulary[key] as V) : null;
}

function normalizeCustomerStatus(value: string): CustomerStatus | null {
  return lookupDomainValue(customerStatusByDomainValue, value);
}

function normalizePriceConditionStatus(value: string | null): CustomerPriceConditionStatus | null {
  if (value === null) return null;
  return lookupDomainValue(priceConditionStatusByDomainValue, value);
}

/** Keep transport vocabulary at the RTK Query boundary. */
export function mapCustomerResponse(response: CustomerResponse): Customer {
  return {
    ...response,
    status: normalizeCustomerStatus(response.status),
    tsPriceConditionStatus: normalizePriceConditionStatus(response.tsPriceConditionStatus),
  };
}
