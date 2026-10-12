import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import {
  customerFilterDictionariesApi,
  selectSearchedLabel,
} from './customerFilterDictionaries.api';

const { getStaticDictionaries, getFilterList, searchFilterList } =
  customerFilterDictionariesApi.endpoints;

let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

/** Path, query and language of every request sent, in order. */
const sentRequests = () =>
  fetchMock.mock.calls
    .map(([request]) => request)
    .filter((request): request is Request => request instanceof Request)
    .map((request) => {
      const url = new URL(request.url);
      return {
        path: `${url.pathname}${url.search}`,
        language: request.headers.get('Accept-Language'),
      };
    });

beforeEach(() => {
  fetchMock = installCustomerApiTestTransport();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('customer filter dictionaries API', () => {
  it('loads every static dictionary labelled in the given language', async () => {
    const store = makeStore();

    const dictionaries = await store.dispatch(getStaticDictionaries.initiate('en')).unwrap();

    expect(sentRequests()).toEqual([{ path: '/api/dictionaries', language: 'en' }]);
    expect(dictionaries['customer-status']).toEqual([
      { value: 'ACTIVE', label: 'Active' },
      { value: 'ARCHIVAL', label: 'Archival' },
    ]);
  });

  it('asks again in Polish when the service has no labels in the language', async () => {
    const store = makeStore();

    const dictionaries = await store.dispatch(getStaticDictionaries.initiate('de')).unwrap();

    expect(sentRequests().map(({ language }) => language)).toEqual(['de', 'pl']);
    expect(dictionaries['customer-status']?.[0]).toEqual({ value: 'ACTIVE', label: 'Aktywny' });
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
    expect(english['customer-status']?.[0]).toEqual({ value: 'ACTIVE', label: 'Active' });
    expect(polish['customer-status']?.[0]).toEqual({ value: 'ACTIVE', label: 'Aktywny' });
  });

  it('loads an advisor list by its advisor type, with the ids as text', async () => {
    const store = makeStore();

    const advisors = await store.dispatch(getFilterList.initiate('rmAdvisors')).unwrap();

    expect(sentRequests()).toEqual([{ path: '/api/v1/users?advisorType=RM', language: null }]);
    expect(advisors[0]).toEqual({ value: '101', label: 'Kowalska Anna' });
  });

  it('loads the teams of the lending product group', async () => {
    const store = makeStore();

    await store.dispatch(getFilterList.initiate('lendingTeams')).unwrap();

    expect(sentRequests()[0]?.path).toBe('/api/v1/teams?productGroup=LENDING');
  });

  it('searches a long list by a part of the name', async () => {
    const store = makeStore();

    const found = await store
      .dispatch(searchFilterList.initiate({ list: 'corporateGroups', name: 'com' }))
      .unwrap();

    expect(sentRequests()[0]?.path).toBe('/api/v1/corporateGroups?name=com');
    expect(found).toEqual([{ value: '22', label: 'Comarch' }]);
  });

  it('names an entry by any cached search of its own list', async () => {
    const store = makeStore();
    await store
      .dispatch(searchFilterList.initiate({ list: 'corporateGroups', name: 'com' }))
      .unwrap();

    expect(selectSearchedLabel(store.getState(), 'corporateGroups', '22')).toBe('Comarch');
    expect(selectSearchedLabel(store.getState(), 'corporateGroups', '21')).toBeUndefined();
    expect(selectSearchedLabel(store.getState(), 'internalGroups', '22')).toBeUndefined();
  });
});
