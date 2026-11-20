import { normalizeDomainValue } from '@/i18n/domainValues';
import {
  TS_PRICE_CONDITION_STATUSES,
  type Customer,
  type CustomerResponse,
  type CustomerStatus,
} from './customers.types';

/** Keys are `normalizeDomainValue` outputs; values are the status contract. */
export const customerStatusByDomainValue: Readonly<Record<string, CustomerStatus>> = {
  active: 'ACTIVE',
  archival: 'ARCHIVAL',
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

/**
 * The list sends the TS price condition status as its number, 1 to 3, while the dictionary and
 * the filter know it by its code. A number outside that range stays as sent.
 */
export function toTsPriceConditionStatusCode(value: unknown): string | null {
  if (typeof value === 'number') return TS_PRICE_CONDITION_STATUSES[value - 1] ?? String(value);
  return typeof value === 'string' ? value : null;
}

/** Keep transport vocabulary at the RTK Query boundary. */
export function mapCustomerResponse(response: CustomerResponse): Customer {
  return {
    ...response,
    status: normalizeCustomerStatus(response.status),
    tsPriceConditionStatus: toTsPriceConditionStatusCode(response.tsPriceConditionStatus),
  };
}
