import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import {
  customerBackendParamsToSearchParams,
  customersApi,
  getCustomersRequest,
  toCustomerBackendParams,
} from './customers.api';
import type { CustomerQuery } from './customers.types';

const makeQuery = (overrides: Partial<CustomerQuery> = {}): CustomerQuery => ({
  q: '',
  page: 1,
  pageSize: 10,
  sort: 'id',
  dir: 'asc',
  status: '',
  type: '',
  lendingRatingReviewDateFrom: '',
  lendingRatingReviewDateTo: '',
  tsPriceConditionEndDateFrom: '',
  tsPriceConditionEndDateTo: '',
  lendingReviewDateFrom: '',
  lendingReviewDateTo: '',
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
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
      status: 'ACTIVE',
      type: 'Corporate',
    });
    expect([...customerBackendParamsToSearchParams(backendParams).entries()]).toEqual([
      ['page', '0'],
      ['size', '10'],
      ['sort', 'id,ASC'],
      ['q', 'bank'],
      ['status', 'ACTIVE'],
      ['type', 'Corporate'],
    ]);
  });

  it('falls back to the allowlisted default for an unknown sort field', () => {
    expect(toCustomerBackendParams(makeQuery({ sort: 'unexpectedField' })).sort).toBe('id,ASC');
  });

  it('builds the endpoint URL from the complete server query', () => {
    expect(
      getCustomersRequest(
        makeQuery({
          q: 'bank group',
          page: 2,
          pageSize: 25,
          sort: 'fullName',
          dir: 'desc',
          status: 'active',
          type: 'Corporate',
        }),
      ),
    ).toEqual({
      url: 'customers?page=1&size=25&sort=fullName%2CDESC&q=bank+group&status=ACTIVE&type=Corporate',
    });
  });

  it('requests one server page, maps its rows, and stores it in the RTK Query cache', async () => {
    const fetchMock = installCustomerApiTestTransport();
    const store = makeStore();
    const query = makeQuery({ q: 'carrefour' });
    const subscription = store.dispatch(customersApi.endpoints.getCustomers.initiate(query));

    const response = await subscription.unwrap();
    const cached = customersApi.endpoints.getCustomers.select(query)(store.getState());
    const request = fetchMock.mock.calls[0]?.[0];

    expect(request).toBeInstanceOf(Request);
    if (!(request instanceof Request)) throw new Error('Expected fetch to receive a Request');

    expect(new URL(request.url).searchParams.get('q')).toBe('carrefour');
    expect(response.content.map(({ shortName }) => shortName)).toEqual(['CARREFOUR POLAND']);
    expect(response.content[0]?.status).toBe('ACTIVE');
    expect(response.page.totalElements).toBe(1);
    expect(cached.status).toBe('fulfilled');
    expect(cached.data).toEqual(response);

    subscription.unsubscribe();
    store.dispatch(customersApi.util.resetApiState());
  });
});
