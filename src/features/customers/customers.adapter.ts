import { normalizeDomainValue } from '@/i18n/domainValues';
import type { Customer, CustomerResponse, CustomerStatus, CustomerType } from './customers.types';

/** Keys are `normalizeDomainValue` outputs; values are the status contract. */
export const customerStatusByDomainValue: Readonly<Record<string, CustomerStatus>> = {
  active: 'ACTIVE',
  archival: 'ARCHIVAL',
};

/**
 * Keys are `normalizeDomainValue` outputs of the warehouse labels the service
 * sends; values are the type contract. A backend enum with other spellings
 * adds keys here, not members.
 */
export const customerTypeByDomainValue: Readonly<Record<string, CustomerType>> = {
  corporate: 'CORPORATE',
  'corporate_(finansstrukturalne)': 'CORPORATE_STRUCTURED_FINANCE',
  'instfin_bank inwestycyjny': 'INSTFIN_INVESTMENT_BANK',
  'instfin_bank n/inwestycyjny': 'INSTFIN_NON_INVESTMENT_BANK',
  'instfin_dom makl/broker': 'INSTFIN_BROKERAGE_HOUSE',
  instfin_ubezpieczyciel: 'INSTFIN_INSURER',
  'instfin_f.leasingowa': 'INSTFIN_LEASING_COMPANY',
  'instfin_f.faktoringowa': 'INSTFIN_FACTORING_COMPANY',
  instfin_izbarozliczeniowa: 'INSTFIN_CLEARING_HOUSE',
  'instfin_f.obrwierzyt n/factoring': 'INSTFIN_NON_FACTORING_DEBT_TRADING',
  instfin_innainstfin: 'INSTFIN_OTHER',
  instfin_tfi: 'INSTFIN_INVESTMENT_FUND_COMPANY',
  'instfin_fund.inwestycyjny': 'INSTFIN_INVESTMENT_FUND',
  'corporate_(finansnieruchkomerc_constr)': 'CORPORATE_COMMERCIAL_REAL_ESTATE_CONSTRUCTION',
  'corporate_(finansnieruchkomerc_refinans)': 'CORPORATE_COMMERCIAL_REAL_ESTATE_REFINANCING',
  'kartoteka techniczna': 'TECHNICAL_RECORD',
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
