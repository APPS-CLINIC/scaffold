import type { CustomerFilters } from './customers.filters';

/** Backend customer status contract — the only two values the service emits. */
export const CUSTOMER_STATUSES = ['ACTIVE', 'ARCHIVAL'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

/** Customer types the list endpoint filters by. */
export const CUSTOMER_TYPES = [
  'CORPORATE',
  'CORPORATE_STRUCTURED_FINANCE',
  'INVESTMENT_BANK',
  'NON_INVESTMENT_BANK',
  'BROKERAGE_HOUSE',
  'INSURANCE_COMPANY',
  'LEASING_COMPANY',
  'FACTORING_COMPANY',
  'CLEARING_HOUSE',
  'RECEIVABLES_TRADING_COMPANY',
  'OTHER_FINANCIAL_INSTITUTION',
  'INVESTMENT_FUND_MANAGEMENT_COMPANY',
  'INVESTMENT_FUND',
  'COMMERCIAL_REAL_ESTATE_CONSTRUCTION_FINANCE',
  'COMMERCIAL_REAL_ESTATE_REFINANCING',
  'TECHNICAL_RECORD',
] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

/** TS price condition statuses the list endpoint filters by. */
export const TS_PRICE_CONDITION_STATUSES = [
  'STANDARD_CONTRACT_END_DATE',
  'NON_STANDARD_CONTRACT_END_DATE',
  'NO_CONTRACT_END_DATE',
] as const;
export type TsPriceConditionStatus = (typeof TS_PRICE_CONDITION_STATUSES)[number];

export type SortDirection = 'asc' | 'desc';

/** Raw customer item returned by the backend. Property names and nullability follow the API contract. */
export interface CustomerResponse {
  id: number;
  fullName: string;
  shortName: string;
  grid: string;
  corporateGroupId: number | null;
  corporateGroupName: string | null;
  internalGroupId: number | null;
  internalGroupName: string | null;
  kkf: string | null;
  krs: string | null;
  taxId: string | null;
  regon: string | null;
  rmAdvisor: string | null;
  lendingAdvisor: string | null;
  sfAdvisor: string | null;
  pcmAdvisor: string | null;
  fmAdvisor: string | null;
  tsAdvisor: string | null;
  ebdAdvisor: string | null;
  implementationAdvisor: string | null;
  customerServiceAdvisor: string | null;
  lendingTeam: string | null;
  extensionReviewDate: string | null;
  lendingReviewDate: string | null;
  lendingRatingDate: string | null;
  lendingRatingReviewDate: string | null;
  lendingRating: string | null;
  tsPriceConditionEndDate: string | null;
  tsPriceConditionStatus: number | null;
  type: string | null;
  status: string;
}

/** App-facing row with the backend status label normalized for reusable cells. */
export interface Customer extends Omit<CustomerResponse, 'status'> {
  status: CustomerStatus | null;
}

/**
 * App-facing list query. `page` is always 1-based at this boundary. The backend
 * transport shape (0-based page, Spring `sort` syntax, repeated filter params) is
 * derived from this single source in `toCustomerBackendParams`.
 */
export interface CustomerQuery {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  dir: SortDirection;
  filters: CustomerFilters;
}

export type { PageResponse, ExportRequest } from '@/api/baseApi.types.ts';
