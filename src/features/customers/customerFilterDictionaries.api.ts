import type { FetchArgs } from '@reduxjs/toolkit/query/react';
import { baseApi } from '@/api/baseApi';
import type { RootState } from '@/app/store';
import type { TableFilterOption } from '@/ui';
import type { PageResponse } from './customers.types';

/** The lists change with releases, not with what the user does, so they stay cached. */
const LIST_CACHE_SECONDS = 60 * 60;

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

interface FilterListEntry {
  id: number;
  name: string;
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
      keepUnusedDataFor: LIST_CACHE_SECONDS,
    }),
  }),
});

export const { useGetFilterListPagesInfiniteQuery } = customerFilterDictionariesApi;

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
