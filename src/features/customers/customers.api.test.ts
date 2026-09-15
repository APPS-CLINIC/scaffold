import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import * as baseApiModule from '@/api/baseApi';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import {
  customerBackendParamsToSearchParams,
  customersApi,
  exportCustomersRequest,
  getCustomersRequest,
  toCustomerBackendParams,
} from './customers.api';
import type { CustomerQuery, ExportRequest } from './customers.types';

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

  it('sorts by the new rating and team fields and no longer by the corporate group GRID', () => {
    expect(toCustomerBackendParams(makeQuery({ sort: 'lendingRating' })).sort).toBe(
      'lendingRating,ASC',
    );
    expect(toCustomerBackendParams(makeQuery({ sort: 'lendingTeam' })).sort).toBe(
      'lendingTeam,ASC',
    );
    expect(toCustomerBackendParams(makeQuery({ sort: 'corporateGroupGRID' })).sort).toBe('id,ASC');
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

describe('customer export contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a GET export URL with the locale and only the known customer columns', () => {
    const request = exportCustomersRequest({
      locale: 'pl',
      columnSelection: ['fullName', 'secretToken', 'grid'],
    });

    expect(request.method).toBe('GET');
    expect(request.url).toBe('customers/export?locale=pl&columnSelection=fullName%2Cgrid');
  });

  it('omits the column selection when no known column is requested', () => {
    expect(exportCustomersRequest({ locale: 'en' }).url).toBe('customers/export?locale=en');
    expect(exportCustomersRequest({ locale: 'en', columnSelection: ['unknown'] }).url).toBe(
      'customers/export?locale=en',
    );
  });

  it('hands the binary response to the download helper with the customers fallback name', async () => {
    const download = vi
      .spyOn(baseApiModule, 'downloadFileFromResponse')
      .mockResolvedValue(undefined);
    const response = new Response(new Blob(['xlsx']));

    await exportCustomersRequest({ locale: 'pl' }).responseHandler(response);

    expect(download).toHaveBeenCalledWith(response, 'customers.xlsx');
  });

  it('requests the export through the RTK Query mutation and downloads the file', async () => {
    const fetchMock = installCustomerApiTestTransport();
    fetchMock.mockResolvedValueOnce(
      new Response(new Blob(['xlsx']), {
        headers: { 'Content-Disposition': 'attachment; filename="customers.xlsx"' },
      }),
    );
    const download = vi
      .spyOn(baseApiModule, 'downloadFileFromResponse')
      .mockResolvedValue(undefined);
    const store = makeStore();
    const params: ExportRequest = { locale: 'en', columnSelection: ['fullName'] };

    await store.dispatch(customersApi.endpoints.exportCustomers.initiate(params)).unwrap();

    const request = fetchMock.mock.calls[0]?.[0];
    if (!(request instanceof Request)) throw new Error('Expected fetch to receive a Request');
    const url = new URL(request.url);

    expect(request.method).toBe('GET');
    expect(url.pathname).toBe('/api/customers/export');
    expect(url.searchParams.get('locale')).toBe('en');
    expect(url.searchParams.get('columnSelection')).toBe('fullName');
    expect(download).toHaveBeenCalledTimes(1);

    store.dispatch(customersApi.util.resetApiState());
  });
});
