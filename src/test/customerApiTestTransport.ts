import { vi } from 'vitest';
import {
  createCustomerResponseFixture,
  customerFirstPageResponse,
} from '@/dev/previewData/customers.fixture';
import type { CustomerResponse, PageResponse } from '@/features/customers/customers.types';

const NativeRequest = globalThis.Request;
const CUSTOMER_API_PATH = '/api/v1/customer';
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

const carrefourPage: PageResponse<CustomerResponse> = {
  content: [
    createCustomerResponseFixture(34105, 'CARREFOUR POLAND SP. Z O.O.', {
      shortName: 'CARREFOUR POLAND',
    }),
  ],
  page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
};

const inactivePage: PageResponse<CustomerResponse> = {
  content: [
    createCustomerResponseFixture(25788, 'OZAROW CEMENT S.A.', { status: 'nieaktywny' }),
    createCustomerResponseFixture(35106, 'INACTIVE CUSTOMER TWO', { status: 'nieaktywny' }),
    createCustomerResponseFixture(36107, 'INACTIVE CUSTOMER THREE', { status: 'nieaktywny' }),
    createCustomerResponseFixture(37108, 'INACTIVE CUSTOMER FOUR', { status: 'nieaktywny' }),
  ],
  page: { size: 10, number: 0, totalElements: 4, totalPages: 1 },
};

function getTestResponse(searchParams: URLSearchParams): PageResponse<CustomerResponse> {
  if (searchParams.get('q') === 'carrefour') return carrefourPage;
  if (searchParams.get('status') === 'inactive') return inactivePage;
  return customerFirstPageResponse;
}

/** Install a static HTTP test double; production code always calls the real backend. */
export function installCustomerApiTestTransport() {
  vi.stubGlobal('Request', AbsoluteTestRequest);

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request =
        input instanceof NativeRequest ? input : new NativeRequest(new URL(String(input)), init);
      const requestUrl = new URL(request.url);

      if (requestUrl.pathname !== CUSTOMER_API_PATH) {
        return new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(getTestResponse(requestUrl.searchParams)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  );

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
