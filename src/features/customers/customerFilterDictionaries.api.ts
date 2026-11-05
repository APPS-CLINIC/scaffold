import type { FetchArgs } from '@reduxjs/toolkit/query/react';
import { apiRootBaseQuery, baseApi } from '@/api/baseApi';
import type { RootState } from '@/app/store';
import type { TableFilterOption } from '@/ui';
import type { PageResponse } from './customers.types';

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

/** How many entries of a list one request asks for; the open list loads more as it scrolls. */
const FILTER_LIST_PAGE_SIZE = 20;

const advisors = (advisorType: string) => ({ url: 'users', params: { advisorType } });

/** The lists the service serves a page at a time, and where they come from. */
const LIST_REQUESTS = {
  internalGroups: { url: 'internalGroups', params: {} },
  corporateGroups: { url: 'corporateGroups', params: {} },
  rmAdvisors: advisors('RM'),
  lendingAdvisors: advisors('LENDING'),
  sfAdvisors: advisors('SF'),
  pcmAdvisors: advisors('PCM'),
  fmAdvisors: advisors('FM'),
  tsAdvisors: advisors('TS'),
  implementationAdvisors: advisors('IMPLEMENTATION'),
  customerServiceAdvisors: advisors('CUSTOMER_SERVICE'),
  ebdAdvisors: advisors('EBD'),
  lendingTeams: { url: 'teams', params: { productGroup: 'LENDING' } },
} satisfies Record<string, FetchArgs>;
export type FilterList = keyof typeof LIST_REQUESTS;

export interface FilterListSearch {
  list: FilterList;
  /** A part of the entry names to look for, or `''` for the whole list. */
  name: string;
}

/** One page of a list, as options, and how many pages the list has. */
export interface FilterListPage {
  options: readonly TableFilterOption[];
  totalPages: number;
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
function toFilterListPage({ content, page }: PageResponse<FilterListEntry>): FilterListPage {
  return {
    options: content.map(({ id, name }) => ({ value: String(id), label: name })),
    totalPages: page.totalPages,
  };
}

export const customerFilterDictionariesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Every static dictionary, labelled in `language`, or in Polish when the service has none in it. */
    getStaticDictionaries: builder.query<StaticDictionaryOptions, string>({
      async queryFn(language, api, extraOptions) {
        const fetchIn = (acceptLanguage: string) =>
          apiRootBaseQuery(
            { url: 'dictionaries', headers: { 'Accept-Language': acceptLanguage } },
            api,
            extraOptions,
          );
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
    /** A list, or the entries whose names contain `name`, a page at a time from the first. */
    getFilterListPages: builder.infiniteQuery<FilterListPage, FilterListSearch, number>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          lastPageParam + 1 < lastPage.totalPages ? lastPageParam + 1 : undefined,
      },
      query: ({ queryArg: { list, name }, pageParam }) => {
        const { url, params } = LIST_REQUESTS[list];
        return {
          url,
          params: {
            ...params,
            ...(name ? { name } : {}),
            page: pageParam,
            size: FILTER_LIST_PAGE_SIZE,
          },
        };
      },
      transformResponse: toFilterListPage,
      keepUnusedDataFor: DICTIONARY_CACHE_SECONDS,
    }),
  }),
});

export const { useGetStaticDictionariesQuery, useGetFilterListPagesInfiniteQuery } =
  customerFilterDictionariesApi;

/**
 * The label the service gave `value` in any page of `list` still cached, searched or not, so a
 * picked entry keeps its name after the list that showed it has moved on.
 */
export function selectListedLabel(
  state: RootState,
  list: FilterList,
  value: string,
): string | undefined {
  for (const search of customerFilterDictionariesApi.util.selectCachedArgsForQuery(
    state,
    'getFilterListPages',
  )) {
    if (search.list !== list) continue;
    const { data } =
      customerFilterDictionariesApi.endpoints.getFilterListPages.select(search)(state);
    for (const page of data?.pages ?? []) {
      const option = page.options.find((entry) => entry.value === value);
      if (option !== undefined && 'label' in option) return option.label;
    }
  }
  return undefined;
}
