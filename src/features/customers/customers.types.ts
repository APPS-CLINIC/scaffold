/** Backend customer status contract — the only two values the service emits. */
export type CustomerStatus = 'ACTIVE' | 'ARCHIVAL';

/** Lowercase status vocabulary used in URLs and list filters. */
export type CustomerStatusFilter = 'active' | 'archival';

/**
 * Customer type contract. The members are the front end's stable identifiers;
 * the spellings the service actually sends are listed in
 * `customerTypeByDomainValue`.
 */
export type CustomerType =
  | 'CORPORATE'
  | 'CORPORATE_STRUCTURED_FINANCE'
  | 'INSTFIN_INVESTMENT_BANK'
  | 'INSTFIN_NON_INVESTMENT_BANK'
  | 'INSTFIN_BROKERAGE_HOUSE'
  | 'INSTFIN_INSURER'
  | 'INSTFIN_LEASING_COMPANY'
  | 'INSTFIN_FACTORING_COMPANY'
  | 'INSTFIN_CLEARING_HOUSE'
  | 'INSTFIN_NON_FACTORING_DEBT_TRADING'
  | 'INSTFIN_OTHER'
  | 'INSTFIN_INVESTMENT_FUND_COMPANY'
  | 'INSTFIN_INVESTMENT_FUND'
  | 'CORPORATE_COMMERCIAL_REAL_ESTATE_CONSTRUCTION'
  | 'CORPORATE_COMMERCIAL_REAL_ESTATE_REFINANCING'
  | 'TECHNICAL_RECORD';

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

/** App-facing row with the backend status and type labels normalized for the cells. */
export interface Customer extends Omit<CustomerResponse, 'status' | 'type'> {
  status: CustomerStatus | null;
  type: CustomerType | null;
}

/**
 * App-facing list query. `page` is always 1-based at this boundary. The
 * optional `status`/`type` values are the customer-specific list filters
 * (empty string means "no filter"); the backend transport shape (0-based
 * page, Spring `sort` syntax) is derived from this single source in
 * `toCustomerBackendParams`.
 */
export interface CustomerQuery {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  dir: SortDirection;
  status: '' | CustomerStatusFilter;
  type: string;
}

export type { PageResponse, ExportRequest } from '@/api/baseApi.types.ts';
