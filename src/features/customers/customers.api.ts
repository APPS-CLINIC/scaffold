import { baseApi } from '@/api/baseApi';
import { mapCustomerResponse } from './customers.adapter';
import type {
  Customer,
  CustomerQuery,
  CustomerResponse,
  CustomerStatus,
  PageResponse,
} from './customers.types';

const DEFAULT_PAGE_SIZE = 10;

const customerSortFields = new Set<keyof Customer>([
  'id',
  'fullName',
  'shortName',
  'grid',
  'corporateGroupId',
  'corporateGroupName',
  'corporateGroupGRID',
  'internalGroupId',
  'internalGroupName',
  'kkf',
  'krs',
  'taxId',
  'regon',
  'rmAdvisor',
  'lendingAdvisor',
  'sfAdvisor',
  'pcmAdvisor',
  'fmAdvisor',
  'tsAdvisor',
  'ebdAdvisor',
  'implementationAdvisor',
  'customerServiceAdvisor',
  'extensionReviewDate',
  'lendingReviewDate',
  'lendingRatingDate',
  'lendingRatingReviewDate',
  'tsPriceConditionEndDate',
  'tsPriceConditionStatus',
  'type',
  'status',
]);

function toPositiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : fallback;
}

function isCustomerSortField(field: string): field is keyof Customer {
  return customerSortFields.has(field as keyof Customer);
}

/** Convert the app's 1-based page to the Spring service's 0-based contract. */
export function toCustomerBackendParams(query: CustomerQuery) {
  const page = toPositiveInteger(query.page, 1) - 1;
  const size = toPositiveInteger(query.pageSize, DEFAULT_PAGE_SIZE);
  const requestedSortField = query.sort.trim();
  const sortField = isCustomerSortField(requestedSortField) ? requestedSortField : 'id';
  const sortDirection: 'ASC' | 'DESC' = query.dir === 'desc' ? 'DESC' : 'ASC';
  const q = query.q.trim();
  const type = query.type.trim();
  // The URL keeps the lowercase filter vocabulary; the service expects the
  // uppercase status values.
  const status: CustomerStatus | undefined =
    query.status === 'active' ? 'ACTIVE' : query.status === 'archival' ? 'ARCHIVAL' : undefined;

  return {
    page,
    size,
    sort: `${sortField},${sortDirection}` as const,
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  };
}

/**
 * The Spring transport shape, derived from the single conversion above so the
 * query and its backend counterpart can never drift apart.
 */
export type CustomerBackendParams = ReturnType<typeof toCustomerBackendParams>;

/** Build URL parameters for the `/api/customers` endpoint. */
export function customerBackendParamsToSearchParams(
  params: CustomerBackendParams,
): URLSearchParams {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
    sort: params.sort,
  });

  if (params.q) searchParams.set('q', params.q);
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);

  return searchParams;
}

export function getCustomersRequest(query: CustomerQuery): { url: string } {
  const searchParams = customerBackendParamsToSearchParams(toCustomerBackendParams(query));
  return {
    url: `customers?${searchParams.toString()}`,
  };
}

export function mapCustomerPageResponse(
  response: PageResponse<CustomerResponse>,
): PageResponse<Customer> {
  return {
    ...response,
    content: response.content.map(mapCustomerResponse),
  };
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PageResponse<Customer>, CustomerQuery>({
      query: getCustomersRequest,
      transformResponse: mapCustomerPageResponse,
    }),
  }),
});

export const { useGetCustomersQuery } = customersApi;
