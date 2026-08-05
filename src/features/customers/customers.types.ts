export type CustomerStatus = 'active' | 'inactive';

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

/** App-facing list query. `page` is always 1-based at this boundary. */
export interface CustomerQuery {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  dir: SortDirection;
  status: '' | CustomerStatus;
  type: string;
}

/** Query parameters expected by the planned Spring endpoint. */
export interface CustomerBackendParams {
  page: number;
  size: number;
  sort: `${string},${'ASC' | 'DESC'}`;
  q?: string;
  status?: CustomerStatus;
  type?: string;
}

/** Confirmed top-level portion of the photographed list response. */
export interface CustomerContentResponse<T> {
  content: T[];
}

/** Spring-style paginated response. `page.number` is backend-facing and 0-based. */
export interface PageResponse<T> extends CustomerContentResponse<T> {
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
