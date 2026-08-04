export type CustomerStatus = 'active' | 'inactive';

export type CustomerPriceConditionStatus = 'valid' | 'expiring' | 'expired';

export type SortDirection = 'asc' | 'desc';

/**
 * Customer shape exposed by the service boundary. Property names intentionally
 * follow the photographed backend payload so replacing the mock requires no UI
 * remapping.
 */
export interface Customer {
  id: number;
  customerFullName: string;
  customerShortName: string;
  grid: string;
  corporateGroupId: number | null;
  corporateGroupName: string | null;
  corporateGroupGRID: string | null;
  internalGroupId: number | null;
  internalGroupName: string | null;
  kkf: string | null;
  krs: string | null;
  taxID: string | null;
  regon: string | null;
  rmAdvisor: string | null;
  dateReviewExtension: string | null;
  dateReview: string | null;
  ratingDt: string | null;
  tsPriceConditionEndDt: string | null;
  tsPriceConditionStatus: CustomerPriceConditionStatus | null;
  customerSector: string | null;
  customerStatus: CustomerStatus;
}

/** App-facing list query. `page` is always 1-based at this boundary. */
export interface CustomerQuery {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  dir: SortDirection;
  status: '' | CustomerStatus;
  sector: string;
}

/** Query parameters expected by the planned Spring endpoint. */
export interface CustomerBackendParams {
  page: number;
  size: number;
  sort: `${string},${'ASC' | 'DESC'}`;
  q?: string;
  status?: CustomerStatus;
  sector?: string;
}

/** Spring-style paginated response. `page.number` is backend-facing and 0-based. */
export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
