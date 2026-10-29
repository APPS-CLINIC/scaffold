import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { customerFilterDictionariesApi, selectListedLabel } from './customerFilterDictionaries.api';

const { getStaticDictionaries, getFilterListPages } = customerFilterDictionariesApi.endpoints;

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

  it('loads the first page of an advisor list by its advisor type, with the ids as text', async () => {
    const store = makeStore();

    const advisors = await store
      .dispatch(getFilterListPages.initiate({ list: 'rmAdvisors', name: '' }))
      .unwrap();

    expect(sentRequests()).toEqual([
      { path: '/api/v1/users?advisorType=RM&page=0&size=20', language: null },
    ]);
    expect(advisors.pages[0]?.options[0]).toEqual({ value: '101', label: 'Kowalska Anna' });
  });

  it('loads the teams of the lending product group', async () => {
    const store = makeStore();

    await store.dispatch(getFilterListPages.initiate({ list: 'lendingTeams', name: '' })).unwrap();

    expect(sentRequests()[0]?.path).toBe('/api/v1/teams?productGroup=LENDING&page=0&size=20');
  });

  it('searches a list by a part of the name', async () => {
    const store = makeStore();

    const found = await store
      .dispatch(getFilterListPages.initiate({ list: 'corporateGroups', name: 'com' }))
      .unwrap();

    expect(sentRequests()[0]?.path).toBe('/api/v1/corporateGroups?name=com&page=0&size=20');
    expect(found.pages[0]?.options).toEqual([{ value: '22', label: 'Comarch' }]);
  });

  it('loads the next page while the list has more, and no further', async () => {
    fetchMock.mockImplementation(async (input) => {
      const number = Number(new URL((input as Request).url).searchParams.get('page'));
      return new Response(
        JSON.stringify({
          content: [{ id: number + 1, name: `Group ${number + 1}` }],
          page: { size: 20, number, totalElements: 21, totalPages: 2 },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    });
    const store = makeStore();
    const search = { list: 'internalGroups', name: '' } as const;
    await store.dispatch(getFilterListPages.initiate(search)).unwrap();

    const loaded = await store
      .dispatch(getFilterListPages.initiate(search, { direction: 'forward' }))
      .unwrap();

    expect(sentRequests().map(({ path }) => path)).toEqual([
      '/api/v1/internalGroups?page=0&size=20',
      '/api/v1/internalGroups?page=1&size=20',
    ]);
    expect(loaded.pages.flatMap((page) => page.options)).toEqual([
      { value: '1', label: 'Group 1' },
      { value: '2', label: 'Group 2' },
    ]);
    expect(getFilterListPages.select(search)(store.getState()).hasNextPage).toBe(false);
  });

  it('names an entry by any cached page of its own list', async () => {
    const store = makeStore();
    await store
      .dispatch(getFilterListPages.initiate({ list: 'corporateGroups', name: 'com' }))
      .unwrap();

    expect(selectListedLabel(store.getState(), 'corporateGroups', '22')).toBe('Comarch');
    expect(selectListedLabel(store.getState(), 'corporateGroups', '21')).toBeUndefined();
    expect(selectListedLabel(store.getState(), 'internalGroups', '22')).toBeUndefined();
  });
});
