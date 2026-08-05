import { baseApi } from '@/api/baseApi';
import customersMock from './customers.mock.json';
import { mapCustomerResponse } from './customers.adapter';
import type {
  Customer,
  CustomerBackendParams,
  CustomerContentResponse,
  CustomerQuery,
  CustomerResponse,
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

const searchableFields: readonly (keyof Customer)[] = [
  'fullName',
  'shortName',
  'grid',
  'corporateGroupName',
  'corporateGroupGRID',
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
  'type',
];

const mockResponse: CustomerContentResponse<CustomerResponse> = customersMock;
const mockCustomers = mockResponse.content.map(mapCustomerResponse);

function toPositiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : fallback;
}

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('en-US')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '');
}

function isCustomerSortField(field: string): field is keyof Customer {
  return customerSortFields.has(field as keyof Customer);
}

function compareValues(left: Customer[keyof Customer], right: Customer[keyof Customer]): number {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right), 'en-US', {
    numeric: true,
    sensitivity: 'base',
  });
}

/** Convert the app's 1-based page to the Spring service's 0-based contract. */
export function toCustomerBackendParams(query: CustomerQuery): CustomerBackendParams {
  const page = toPositiveInteger(query.page, 1) - 1;
  const size = toPositiveInteger(query.pageSize, DEFAULT_PAGE_SIZE);
  const requestedSortField = query.sort.trim();
  const sortField = isCustomerSortField(requestedSortField) ? requestedSortField : 'id';
  const sortDirection = query.dir === 'desc' ? 'DESC' : 'ASC';
  const q = query.q.trim();
  const type = query.type.trim();

  return {
    page,
    size,
    sort: `${sortField},${sortDirection}`,
    ...(q ? { q } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(type ? { type } : {}),
  };
}

/** Build URL parameters for the planned `/api/v1/customer` endpoint. */
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

/**
 * Temporary deterministic server implementation. Its operation order mirrors
 * the backend: filter/search, sort, then paginate.
 */
export function queryMockCustomers(
  query: CustomerQuery,
  source: readonly Customer[] = mockCustomers,
): PageResponse<Customer> {
  const backendParams = toCustomerBackendParams(query);
  const normalizedQuery = normalizeSearchValue(backendParams.q ?? '');
  const normalizedType = normalizeSearchValue(backendParams.type ?? '');
  const [requestedSortField = 'id'] = backendParams.sort.split(',');
  const sortField = isCustomerSortField(requestedSortField) ? requestedSortField : 'id';
  const direction = query.dir === 'desc' ? -1 : 1;

  const filtered = source.filter((customer) => {
    if (backendParams.status && customer.status !== backendParams.status) return false;
    if (normalizedType && normalizeSearchValue(customer.type ?? '') !== normalizedType) {
      return false;
    }
    if (!normalizedQuery) return true;

    return searchableFields.some((field) => {
      const value = customer[field];
      return value !== null && normalizeSearchValue(String(value)).includes(normalizedQuery);
    });
  });

  const sorted = filtered.toSorted((left, right) => {
    const comparison = compareValues(left[sortField], right[sortField]);
    return comparison === 0 ? left.id - right.id : comparison * direction;
  });

  const start = backendParams.page * backendParams.size;
  const totalElements = sorted.length;

  return {
    content: sorted.slice(start, start + backendParams.size),
    page: {
      size: backendParams.size,
      number: backendParams.page,
      totalElements,
      totalPages: totalElements === 0 ? 0 : Math.ceil(totalElements / backendParams.size),
    },
  };
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PageResponse<Customer>, CustomerQuery>({
      queryFn: (query) => ({ data: queryMockCustomers(query) }),
    }),
  }),
});

export const { useGetCustomersQuery } = customersApi;
