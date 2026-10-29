import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { shallowEqual } from 'react-redux';
import { useAppSelector } from '@/app/hooks';
import { MAX_FILTER_VALUES } from '@/features/urlState/urlState.schema';
import {
  createSearchMultiSelectFilter,
  type FilterOptionSearch,
  type LoadedFilterOptions,
  type TableFilterOption,
} from '@/ui';
import {
  selectListedLabel,
  useGetFilterListPagesInfiniteQuery,
  type FilterList,
} from '../customerFilterDictionaries.api';

interface CustomerSearchFilterProps {
  list: FilterList;
  /** A first choice for customers without a value, such as no own group. */
  noneOption?: TableFilterOption;
}

function useCustomerSearchOptions(
  { list, noneOption }: CustomerSearchFilterProps,
  { text, values, load }: FilterOptionSearch,
): LoadedFilterOptions {
  const picked = useMemo(
    () => values.filter((value) => value !== noneOption?.value),
    [noneOption, values],
  );
  const listedLabels = useAppSelector(
    (state) => picked.map((value) => selectListedLabel(state, list, value)),
    shallowEqual,
  );
  // The chip loads only the first page, and only to name a picked entry no loaded page names.
  const loads = load || listedLabels.some((label) => label === undefined);
  const { data, isFetching, isFetchingNextPage, isError, hasNextPage, fetchNextPage } =
    useGetFilterListPagesInfiniteQuery(loads ? { list, name: load ? text : '' } : skipToken);

  return useMemo(() => {
    // A skipped query still returns its last result, which no longer matches the search.
    const listed = (loads ? data?.pages.flatMap((page) => page.options) : undefined) ?? [];
    // Without a cached page that lists a picked entry, its id stands in for its name.
    const pickedOptions = picked.map((value, index) => ({
      value,
      label: listedLabels[index] ?? value,
    }));
    return {
      // The picked entries come first, wherever the list has them.
      options: [
        ...(noneOption === undefined ? [] : [noneOption]),
        ...pickedOptions,
        ...listed.filter((option) => !picked.includes(option.value)),
      ],
      // The next page has its own loader under the list, not the field's spinner.
      loading: isFetching && !isFetchingNextPage,
      failed: isError,
      loadMore: load && hasNextPage && !isFetching ? () => void fetchNextPage() : undefined,
      loadingMore: isFetchingNextPage,
    };
  }, [
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    listedLabels,
    load,
    loads,
    noneOption,
    picked,
  ]);
}

/**
 * Picks entries of a list the service serves a page at a time: the open list shows the first
 * page, loads the next as it scrolls, and the service searches the list by a part of the name
 * typed into it. Picked entries come first. Filters by the entries' ids.
 */
export const CustomerSearchFilter = createSearchMultiSelectFilter(useCustomerSearchOptions, {
  selectionLimit: MAX_FILTER_VALUES,
});
