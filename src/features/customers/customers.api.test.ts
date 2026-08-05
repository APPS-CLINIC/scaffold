import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import {
  customerBackendParamsToSearchParams,
  customersApi,
  queryMockCustomers,
  toCustomerBackendParams,
} from './customers.api';
import type { Customer, CustomerQuery } from './customers.types';

const makeQuery = (overrides: Partial<CustomerQuery> = {}): CustomerQuery => ({
  q: '',
  page: 1,
  pageSize: 10,
  sort: 'id',
  dir: 'asc',
  status: '',
  type: '',
  ...overrides,
});

const makeCustomer = (
  id: number,
  fullName: string,
  overrides: Partial<Customer> = {},
): Customer => ({
  id,
  fullName,
  shortName: fullName,
  grid: String(id),
  corporateGroupId: null,
  corporateGroupName: null,
  corporateGroupGRID: null,
  internalGroupId: null,
  internalGroupName: null,
  kkf: null,
  krs: null,
  taxId: null,
  regon: null,
  rmAdvisor: null,
  lendingAdvisor: null,
  sfAdvisor: null,
  pcmAdvisor: null,
  fmAdvisor: null,
  tsAdvisor: null,
  ebdAdvisor: null,
  implementationAdvisor: null,
  customerServiceAdvisor: null,
  extensionReviewDate: null,
  lendingReviewDate: null,
  lendingRatingDate: null,
  lendingRatingReviewDate: null,
  tsPriceConditionEndDate: null,
  tsPriceConditionStatus: null,
  type: null,
  status: 'active',
  ...overrides,
});

describe('customer API contract', () => {
  it('maps app page 1 to backend page 0 and builds Spring query parameters', () => {
    const backendParams = toCustomerBackendParams(
      makeQuery({ q: 'bank', status: 'active', type: 'Corporate' }),
    );

    expect(backendParams).toEqual({
      page: 0,
      size: 10,
      sort: 'id,ASC',
      q: 'bank',
      status: 'active',
      type: 'Corporate',
    });
    expect([...customerBackendParamsToSearchParams(backendParams).entries()]).toEqual([
      ['page', '0'],
      ['size', '10'],
      ['sort', 'id,ASC'],
      ['q', 'bank'],
      ['status', 'active'],
      ['type', 'Corporate'],
    ]);
  });

  it('falls back to the allowlisted default for an unknown sort field', () => {
    expect(toCustomerBackendParams(makeQuery({ sort: 'unexpectedField' })).sort).toBe('id,ASC');
  });

  it('filters and searches, then sorts before selecting a page', () => {
    const source = [
      makeCustomer(1, 'Zulu Energy', {
        corporateGroupName: 'Priority Group',
        type: 'Corporate',
      }),
      makeCustomer(2, 'Retail Priority', {
        corporateGroupName: 'Priority Group',
        type: 'Institutional',
      }),
      makeCustomer(3, 'Beta Energy', {
        corporateGroupName: 'Priority Group',
        type: 'Corporate',
      }),
      makeCustomer(4, 'Inactive Energy', {
        corporateGroupName: 'Priority Group',
        type: 'Corporate',
        status: 'inactive',
      }),
      makeCustomer(5, 'Alpha Energy', {
        corporateGroupName: 'Priority Group',
        type: 'Corporate',
      }),
      makeCustomer(6, 'Other Energy', {
        corporateGroupName: 'Secondary Group',
        type: 'Corporate',
      }),
    ];
    const query = makeQuery({
      q: 'priority',
      status: 'active',
      type: 'corporate',
      sort: 'fullName',
      page: 2,
      pageSize: 1,
    });

    const response = queryMockCustomers(query, source);

    expect(response.content.map(({ fullName }) => fullName)).toEqual(['Beta Energy']);
    expect(response.page).toEqual({
      size: 1,
      number: 1,
      totalElements: 3,
      totalPages: 3,
    });
    expect(queryMockCustomers(query, source)).toEqual(response);
  });

  it('returns consistent Spring page metadata for the full mock dataset', () => {
    const response = queryMockCustomers(makeQuery({ page: 2, pageSize: 5 }));

    expect(response.content).toHaveLength(5);
    expect(response.page).toEqual({
      size: 5,
      number: 1,
      totalElements: 15,
      totalPages: 3,
    });
  });

  it('stores fulfilled endpoint data in the shared RTK Query cache', async () => {
    const store = makeStore();
    const query = makeQuery({ q: 'carrefour' });
    const subscription = store.dispatch(customersApi.endpoints.getCustomers.initiate(query));

    const response = await subscription.unwrap();
    const cached = customersApi.endpoints.getCustomers.select(query)(store.getState());

    expect(response.content.map(({ shortName }) => shortName)).toEqual(['CARREFOUR POLAND']);
    expect(cached.status).toBe('fulfilled');
    expect(cached.data).toEqual(response);

    subscription.unsubscribe();
    store.dispatch(customersApi.util.resetApiState());
  });
});
