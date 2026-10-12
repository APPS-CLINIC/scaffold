import type { FetchArgs } from '@reduxjs/toolkit/query/react';
import { baseApi } from '@/api/baseApi';
import type { RootState } from '@/app/store';
import type { TableFilterOption } from '@/ui';

/** The language every dictionary has labels in. */
const DEFAULT_LANGUAGE = 'pl';

/** Dictionaries change with releases, not with what the user does, so they stay cached. */
const DICTIONARY_CACHE_SECONDS = 60 * 60;

/** The dictionaries `GET /api/dictionaries` serves, by the service's names. */
export const STATIC_DICTIONARIES = [
  'customer-status',
  'customer-type',
  'ts-price-condition-status',
] as const;
export type StaticDictionary = (typeof STATIC_DICTIONARIES)[number];

const advisors = (advisorType: string): FetchArgs => ({
  url: 'v1/users',
  params: { advisorType },
});

/** Lists short enough to load whole, and where they come from. */
const LIST_REQUESTS = {
  rmAdvisors: advisors('RM'),
  lendingAdvisors: advisors('LENDING'),
  sfAdvisors: advisors('SF'),
  pcmAdvisors: advisors('PCM'),
  fmAdvisors: advisors('FM'),
  tsAdvisors: advisors('TS'),
  implementationAdvisors: advisors('IMPLEMENTATION'),
  customerServiceAdvisors: advisors('CUSTOMER_SERVICE'),
  ebdAdvisors: advisors('EBD'),
  lendingTeams: { url: 'v1/teams', params: { productGroup: 'LENDING' } },
} satisfies Record<string, FetchArgs>;
export type FilterList = keyof typeof LIST_REQUESTS;

/** Lists too long to load whole; the service searches them by a part of the name. */
const SEARCH_URLS = {
  internalGroups: 'v1/internalGroups',
  corporateGroups: 'v1/corporateGroups',
};
export type SearchableFilterList = keyof typeof SEARCH_URLS;

export interface FilterListSearch {
  list: SearchableFilterList;
  name: string;
}

interface StaticDictionaryEntry {
  code: string;
  label: string;
}

interface FilterListEntry {
  id: number;
  name: string;
}

export type StaticDictionaryOptions = Partial<Record<string, readonly TableFilterOption[]>>;

function toStaticDictionaryOptions(
  response: Partial<Record<string, readonly StaticDictionaryEntry[]>>,
): StaticDictionaryOptions {
  return Object.fromEntries(
    Object.entries(response).map(([dictionary, entries = []]) => [
      dictionary,
      entries.map(({ code, label }) => ({ value: code, label })),
    ]),
  );
}

/** The filters send the id as text, like every value they keep in the URL. */
function toFilterListOptions(entries: readonly FilterListEntry[]): readonly TableFilterOption[] {
  return entries.map(({ id, name }) => ({ value: String(id), label: name }));
}

export const customerFilterDictionariesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Every static dictionary, labelled in `language`, or in Polish when the service has none in it. */
    getStaticDictionaries: builder.query<StaticDictionaryOptions, string>({
      async queryFn(language, _api, _extraOptions, baseQuery) {
        const fetchIn = (acceptLanguage: string) =>
          baseQuery({ url: 'dictionaries', headers: { 'Accept-Language': acceptLanguage } });
        let result = await fetchIn(language);
        if (result.error?.status === 400 && language !== DEFAULT_LANGUAGE) {
          result = await fetchIn(DEFAULT_LANGUAGE);
        }
        if (result.error) return { error: result.error };
        return {
          data: toStaticDictionaryOptions(
            result.data as Partial<Record<string, readonly StaticDictionaryEntry[]>>,
          ),
        };
      },
      keepUnusedDataFor: DICTIONARY_CACHE_SECONDS,
    }),
    getFilterList: builder.query<readonly TableFilterOption[], FilterList>({
      query: (list) => LIST_REQUESTS[list],
      transformResponse: toFilterListOptions,
      keepUnusedDataFor: DICTIONARY_CACHE_SECONDS,
    }),
    searchFilterList: builder.query<readonly TableFilterOption[], FilterListSearch>({
      query: ({ list, name }) => ({ url: SEARCH_URLS[list], params: { name } }),
      transformResponse: toFilterListOptions,
      keepUnusedDataFor: DICTIONARY_CACHE_SECONDS,
    }),
  }),
});

export const { useGetStaticDictionariesQuery, useGetFilterListQuery, useSearchFilterListQuery } =
  customerFilterDictionariesApi;

/**
 * The label the service gave `value` in any search of `list` still cached, so a picked entry
 * keeps its name after the search that found it is over.
 */
export function selectSearchedLabel(
  state: RootState,
  list: SearchableFilterList,
  value: string,
): string | undefined {
  for (const search of customerFilterDictionariesApi.util.selectCachedArgsForQuery(
    state,
    'searchFilterList',
  )) {
    if (search.list !== list) continue;
    const { data } = customerFilterDictionariesApi.endpoints.searchFilterList.select(search)(state);
    const option = data?.find((entry) => entry.value === value);
    if (option !== undefined && 'label' in option) return option.label;
  }
  return undefined;
}
