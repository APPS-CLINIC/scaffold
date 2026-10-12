import { baseApi, downloadFileFromResponse } from '@/api/baseApi';
import { mapCustomerResponse } from './customers.adapter';
import type { CustomerFilters } from './customers.filters';
import type {
  Customer,
  CustomerQuery,
  CustomerExportRequest,
  CustomerResponse,
  PageResponse,
} from './customers.types';

const DEFAULT_PAGE_SIZE = 10;

const customerFields = new Set<keyof Customer>([
  'id',
  'fullName',
  'shortName',
  'grid',
  'corporateGroupId',
  'corporateGroupName',
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
  'lendingTeam',
  'extensionReviewDate',
  'lendingReviewDate',
  'lendingRatingDate',
  'lendingRatingReviewDate',
  'lendingRating',
  'tsPriceConditionEndDate',
  'tsPriceConditionStatus',
  'type',
  'status',
]);

function toPositiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : fallback;
}

function isCustomerField(field: string): field is keyof Customer {
  return customerFields.has(field as keyof Customer);
}

/** The filter params as the service reads them: each value repeats its param. */
function toCustomerFilterParams(filters: CustomerFilters): [string, string][] {
  return Object.entries(filters).flatMap(([param, values]) =>
    values.map((value): [string, string] => [param, value]),
  );
}

/** Convert the app's 1-based page to the Spring service's 0-based contract. */
export function toCustomerBackendParams(query: CustomerQuery) {
  const page = toPositiveInteger(query.page, 1) - 1;
  const size = toPositiveInteger(query.pageSize, DEFAULT_PAGE_SIZE);
  const requestedSortField = query.sort.trim();
  const sortField = isCustomerField(requestedSortField) ? requestedSortField : 'id';
  const sortDirection: 'ASC' | 'DESC' = query.dir === 'desc' ? 'DESC' : 'ASC';
  const q = query.q.trim();

  return {
    page,
    size,
    sort: `${sortField},${sortDirection}` as const,
    ...(q ? { query: q } : {}),
    filters: toCustomerFilterParams(query.filters),
  };
}

/**
 * The Spring transport shape, derived from the single conversion above so the
 * query and its backend counterpart can never drift apart.
 */
export type CustomerBackendParams = ReturnType<typeof toCustomerBackendParams>;

/** Build URL parameters for the `/api/v1/customers` endpoint. */
export function customerBackendParamsToSearchParams(
  params: CustomerBackendParams,
): URLSearchParams {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
    sort: params.sort,
  });

  if (params.query) searchParams.set('query', params.query);
  for (const [name, value] of params.filters) searchParams.append(name, value);

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

/**
 * Export customers request: the known columns, the search and the filters, with the column
 * headers in `locale`. The service does not sort the file. It returns a binary file, so the
 * `responseHandler` is provided to handle the download.
 */
export function exportCustomersRequest(params: CustomerExportRequest): {
  url: string;
  method: string;
  headers: Record<string, string>;
  responseHandler: (response: Response) => Promise<void>;
} {
  const columnSelection = (params.columnSelection ?? []).filter(isCustomerField).join(',');

  const q = params.q?.trim() ?? '';

  const exportParams = new URLSearchParams({
    ...(columnSelection ? { columnSelection } : {}),
    ...(q ? { query: q } : {}),
  });
  if (params.filters) {
    for (const [name, value] of toCustomerFilterParams(params.filters)) {
      exportParams.append(name, value);
    }
  }

  const query = exportParams.toString();

  return {
    url: query ? `customers/export?${query}` : 'customers/export',
    method: 'GET',
    headers: {
      'Accept-Language': params.locale,
    },
    responseHandler: (response) => downloadFileFromResponse(response, 'customers.xlsx'),
  };
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PageResponse<Customer>, CustomerQuery>({
      query: getCustomersRequest,
      transformResponse: mapCustomerPageResponse,
    }),
    exportCustomers: builder.mutation<void, CustomerExportRequest>({
      query: exportCustomersRequest,
    }),
  }),
});

export const { useGetCustomersQuery, useExportCustomersMutation } = customersApi;
