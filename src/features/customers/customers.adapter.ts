import type {
  Customer,
  CustomerPriceConditionStatus,
  CustomerResponse,
  CustomerStatus,
} from './customers.types';

function normalizeDomainValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('pl-PL')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '');
}

function normalizeCustomerStatus(value: string): CustomerStatus | null {
  switch (normalizeDomainValue(value)) {
    case 'active':
    case 'aktywny':
      return 'active';
    case 'inactive':
    case 'nieaktywny':
      return 'inactive';
    default:
      return null;
  }
}

function normalizePriceConditionStatus(value: string | null): CustomerPriceConditionStatus | null {
  if (value === null) return null;

  switch (normalizeDomainValue(value)) {
    case 'valid':
    case 'wazny':
      return 'valid';
    case 'expiring':
    case 'wkrotce wygasa':
      return 'expiring';
    case 'expired':
    case 'wygasl':
    case 'wygasł':
      return 'expired';
    default:
      return null;
  }
}

/** Keep transport vocabulary at the RTK Query boundary. */
export function mapCustomerResponse(response: CustomerResponse): Customer {
  return {
    ...response,
    status: normalizeCustomerStatus(response.status),
    tsPriceConditionStatus: normalizePriceConditionStatus(response.tsPriceConditionStatus),
  };
}
