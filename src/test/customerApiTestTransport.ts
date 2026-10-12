import { vi } from 'vitest';
import {
  createCustomerResponseFixture,
  customerFirstPageResponse,
} from '@/dev/previewData/customers.fixture';
import type { CustomerResponse, PageResponse } from '@/features/customers/customers.types';
import {
  advisorsByType,
  groupsByList,
  lendingTeams,
  staticDictionariesByLanguage,
} from './customerFilterDictionaries.fixture';

const NativeRequest = globalThis.Request;
const CUSTOMER_API_PATH = '/api/v1/customers';
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

const archivalPage: PageResponse<CustomerResponse> = {
  content: [
    createCustomerResponseFixture(25788, 'OZAROW CEMENT S.A.', { status: 'ARCHIVAL' }),
    createCustomerResponseFixture(35106, 'ARCHIVAL CUSTOMER TWO', { status: 'ARCHIVAL' }),
    createCustomerResponseFixture(36107, 'ARCHIVAL CUSTOMER THREE', { status: 'ARCHIVAL' }),
    createCustomerResponseFixture(37108, 'ARCHIVAL CUSTOMER FOUR', { status: 'ARCHIVAL' }),
  ],
  page: { size: 10, number: 0, totalElements: 4, totalPages: 1 },
};

function getTestResponse(searchParams: URLSearchParams): PageResponse<CustomerResponse> {
  if (searchParams.get('query') === 'carrefour') return carrefourPage;
  if (searchParams.getAll('status').join() === 'ARCHIVAL') return archivalPage;
  return customerFirstPageResponse;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const nameContains = (search: string | null) => (entry: { name: string }) =>
  search === null || entry.name.toLowerCase().includes(search.toLowerCase());

/** The dictionary endpoints the customer filters read, or `undefined` for another path. */
function getDictionaryResponse(request: Request, url: URL): Response | undefined {
  if (url.pathname === '/api/dictionaries') {
    const dictionaries = staticDictionariesByLanguage[request.headers.get('Accept-Language') ?? ''];
    return dictionaries === undefined
      ? json({ message: 'Unsupported language code' }, 400)
      : json(dictionaries);
  }
  const groupList = /^\/api\/v1\/(internalGroups|corporateGroups)$/.exec(url.pathname)?.[1];
  if (groupList !== undefined) {
    return json((groupsByList[groupList] ?? []).filter(nameContains(url.searchParams.get('name'))));
  }
  if (url.pathname === '/api/v1/teams') return json(lendingTeams);
  if (url.pathname === '/api/v1/users') {
    return json(
      url.searchParams.getAll('advisorType').flatMap((type) => advisorsByType[type] ?? []),
    );
  }
  return undefined;
}

/** Install a static HTTP test double; production code always calls the real backend. */
export function installCustomerApiTestTransport() {
  vi.stubGlobal('Request', AbsoluteTestRequest);

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request =
        input instanceof NativeRequest ? input : new NativeRequest(new URL(String(input)), init);
      const requestUrl = new URL(request.url);

      const dictionaryResponse = getDictionaryResponse(request, requestUrl);
      if (dictionaryResponse !== undefined) return dictionaryResponse;

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
