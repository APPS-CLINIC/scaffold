import { normalizeDomainValue } from '@/i18n/domainValues';
import type { Customer, CustomerResponse, CustomerStatus, CustomerType } from './customers.types';

/** Keys are `normalizeDomainValue` outputs; values are the status contract. */
export const customerStatusByDomainValue: Readonly<Record<string, CustomerStatus>> = {
  active: 'ACTIVE',
  archival: 'ARCHIVAL',
};

/** Keys are `normalizeDomainValue` outputs; values are the type contract. */
export const customerTypeByDomainValue: Readonly<Record<string, CustomerType>> = {
  corporate: 'CORPORATE',
};

/**
 * Own-property lookup over a normalized key. Non-string input normalizes to
 * an empty key (no match), and labels like "constructor" must not resolve
 * via Object.prototype. Exported so other customer-scoped adapters (e.g.
 * customerSummary) reuse the same status vocabulary instead of duplicating it.
 */
export function lookupDomainValue<V extends string>(
  vocabulary: Readonly<Record<string, V>>,
  rawValue: unknown,
): V | null {
  const key = normalizeDomainValue(rawValue);
  return Object.hasOwn(vocabulary, key) ? (vocabulary[key] as V) : null;
}

function normalizeCustomerStatus(value: unknown): CustomerStatus | null {
  return lookupDomainValue(customerStatusByDomainValue, value);
}

function normalizeCustomerType(value: unknown): CustomerType | null {
  return lookupDomainValue(customerTypeByDomainValue, value);
}

/** Keep transport vocabulary at the RTK Query boundary. */
export function mapCustomerResponse(response: CustomerResponse): Customer {
  return {
    ...response,
    status: normalizeCustomerStatus(response.status),
    type: normalizeCustomerType(response.type),
  };
}
