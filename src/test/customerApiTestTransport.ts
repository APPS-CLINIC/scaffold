import { vi } from 'vitest';
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

function makeCustomerResponse(
  id: number,
  fullName: string,
  overrides: Partial<CustomerResponse> = {},
): CustomerResponse {
  return {
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
    type: 'Corporate',
    status: 'aktywny',
    ...overrides,
  };
}

const defaultPage: PageResponse<CustomerResponse> = {
  content: [
    makeCustomerResponse(23997, 'ARCELORMITTAL WARSAW SP. Z O.O.', {
      shortName: 'ARCELORMITTAL WARSAW',
      lendingAdvisor: 'Drewniak Dariusz',
    }),
    makeCustomerResponse(24099, 'COMARCH S.A.'),
    makeCustomerResponse(24554, 'ABB SP. Z O.O.'),
    makeCustomerResponse(24853, 'ENERGY RAIL SERVICES SP. Z O.O.'),
    makeCustomerResponse(26606, 'EMITEL S.A.'),
    makeCustomerResponse(27994, 'CEFARM SP. Z O.O.'),
    makeCustomerResponse(30101, 'NORDIC FOODS POLAND SP. Z O.O.'),
    makeCustomerResponse(31102, 'POLISH LOGISTICS S.A.'),
    makeCustomerResponse(32103, 'CENTRAL INDUSTRIES SP. Z O.O.'),
    makeCustomerResponse(33104, 'GREEN ENERGY POLAND S.A.'),
  ],
  page: { size: 10, number: 0, totalElements: 15, totalPages: 2 },
};

const carrefourPage: PageResponse<CustomerResponse> = {
  content: [
    makeCustomerResponse(34105, 'CARREFOUR POLAND SP. Z O.O.', {
      shortName: 'CARREFOUR POLAND',
    }),
  ],
  page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
};

const inactivePage: PageResponse<CustomerResponse> = {
  content: [
    makeCustomerResponse(25788, 'OZAROW CEMENT S.A.', { status: 'nieaktywny' }),
    makeCustomerResponse(35106, 'INACTIVE CUSTOMER TWO', { status: 'nieaktywny' }),
    makeCustomerResponse(36107, 'INACTIVE CUSTOMER THREE', { status: 'nieaktywny' }),
    makeCustomerResponse(37108, 'INACTIVE CUSTOMER FOUR', { status: 'nieaktywny' }),
  ],
  page: { size: 10, number: 0, totalElements: 4, totalPages: 1 },
};

function getTestResponse(searchParams: URLSearchParams): PageResponse<CustomerResponse> {
  if (searchParams.get('q') === 'carrefour') return carrefourPage;
  if (searchParams.get('status') === 'inactive') return inactivePage;
  return defaultPage;
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
