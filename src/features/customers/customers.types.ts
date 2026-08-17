/** Backend customer status contract — the only two values the service emits. */
export enum CustomerStatus {
  Active = 'ACTIVE',
  Archival = 'ARCHIVAL',
}

/** Lowercase status vocabulary used in URLs and list filters. */
export type CustomerStatusFilter = 'active' | 'archival';

export type CustomerPriceConditionStatus = 'valid' | 'expiring' | 'expired';

export type SortDirection = 'asc' | 'desc';

/**
 * Raw customer item returned by the backend. The property names and nullability
 * intentionally follow the photographed payload.
 */
export interface CustomerResponse {
  id: number;
  fullName: string;
  shortName: string;
  grid: string;
  corporateGroupId: number | null;
  corporateGroupName: string | null;
  corporateGroupGRID: string | null;
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
  extensionReviewDate: string | null;
  lendingReviewDate: string | null;
  lendingRatingDate: string | null;
  lendingRatingReviewDate: string | null;
  tsPriceConditionEndDate: string | null;
  tsPriceConditionStatus: string | null;
  type: string | null;
  status: string;
}

/** App-facing row with backend status labels normalized for reusable cells. */
export interface Customer extends Omit<CustomerResponse, 'status' | 'tsPriceConditionStatus'> {
  status: CustomerStatus | null;
  tsPriceConditionStatus: CustomerPriceConditionStatus | null;
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

export type { PageResponse } from '@/api/pagination.types';
