import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { baseApi } from '@/api/baseApi';
import {
  customerAdvisorsResponseFixture,
  customerDetailsResponseFixture,
} from '@/test/customerDetails.fixtures';
import {
  customerDetailsApi,
  getCustomerAdvisorsRequest,
  getCustomerDetailsRequest,
} from './customerDetails.api';

const NativeRequest = globalThis.Request;
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('customer details API contract', () => {
  it('builds both versioned endpoints and encodes the customer id', () => {
    expect(getCustomerDetailsRequest('customer/42 #main')).toEqual({
      url: 'v1/customers/customer%2F42%20%23main',
    });
    expect(getCustomerAdvisorsRequest('customer/42 #main')).toEqual({
      url: 'v1/customers/customer%2F42%20%23main/advisors',
    });
  });

  it('requests and maps detail and advisor payloads through the shared API', async () => {
    vi.stubGlobal('Request', AbsoluteTestRequest);
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const request = input instanceof NativeRequest ? input : new NativeRequest(input);
      const pathname = new URL(request.url).pathname;
      const body = pathname.endsWith('/advisors')
        ? customerAdvisorsResponseFixture
        : customerDetailsResponseFixture;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    const customerId = 'customer/42 #main';
    const details = store.dispatch(
      customerDetailsApi.endpoints.getCustomerDetails.initiate(customerId),
    );
    const advisors = store.dispatch(
      customerDetailsApi.endpoints.getCustomerAdvisors.initiate(customerId),
    );

    await expect(details.unwrap()).resolves.toMatchObject({
      basicData: { taxId: '5250000000' },
      crs: { crsStatus: 'Completed' },
    });
    await expect(advisors.unwrap()).resolves.toMatchObject({
      rmAdvisor: 'Alex Morgan',
    });

    const paths = fetchMock.mock.calls.map(([input]) => {
      if (!(input instanceof Request)) throw new Error('Expected fetch to receive a Request');
      return new URL(input.url).pathname;
    });
    expect(paths).toEqual([
      '/api/v1/customers/customer%2F42%20%23main',
      '/api/v1/customers/customer%2F42%20%23main/advisors',
    ]);

    details.unsubscribe();
    advisors.unsubscribe();
    store.dispatch(baseApi.util.resetApiState());
  });
});
