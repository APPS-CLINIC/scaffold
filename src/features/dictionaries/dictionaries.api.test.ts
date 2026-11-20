import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { dictionariesApi } from './dictionaries.api';

const { getStaticDictionaries } = dictionariesApi.endpoints;

let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

/** Path and language of every request sent, in order. */
const sentRequests = () =>
  fetchMock.mock.calls
    .map(([request]) => request)
    .filter((request): request is Request => request instanceof Request)
    .map((request) => ({
      path: new URL(request.url).pathname,
      language: request.headers.get('Accept-Language'),
    }));

beforeEach(() => {
  fetchMock = installCustomerApiTestTransport();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('static dictionaries API', () => {
  it('loads every static dictionary labelled in the given language', async () => {
    const store = makeStore();

    const dictionaries = await store.dispatch(getStaticDictionaries.initiate('en')).unwrap();

    expect(sentRequests()).toEqual([{ path: '/api/dictionaries', language: 'en' }]);
    expect(dictionaries['customer-status']).toEqual([
      { code: 'ACTIVE', label: 'Active' },
      { code: 'ARCHIVAL', label: 'Archival' },
    ]);
  });

  it('asks again in Polish when the service has no labels in the language', async () => {
    const store = makeStore();

    const dictionaries = await store.dispatch(getStaticDictionaries.initiate('de')).unwrap();

    expect(sentRequests().map(({ language }) => language)).toEqual(['de', 'pl']);
    expect(dictionaries['customer-status']?.[0]).toEqual({ code: 'ACTIVE', label: 'Aktywny' });
  });

  it('reports the error without asking again when the service rejects Polish', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ message: 'Bad request' }), { status: 400 }),
    );
    const store = makeStore();

    const result = await store.dispatch(getStaticDictionaries.initiate('pl'));

    expect(result.isError).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('reports the error without asking again when the service fails for another reason', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 }),
    );
    const store = makeStore();

    const result = await store.dispatch(getStaticDictionaries.initiate('en'));

    expect(result.isError).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps the dictionaries of each language apart', async () => {
    const store = makeStore();

    const english = await store.dispatch(getStaticDictionaries.initiate('en')).unwrap();
    const polish = await store.dispatch(getStaticDictionaries.initiate('pl')).unwrap();

    expect(sentRequests().map(({ language }) => language)).toEqual(['en', 'pl']);
    expect(english['customer-status']?.[0]).toEqual({ code: 'ACTIVE', label: 'Active' });
    expect(polish['customer-status']?.[0]).toEqual({ code: 'ACTIVE', label: 'Aktywny' });
  });
});
