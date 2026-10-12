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
  selectSearchedLabel,
  useSearchFilterListQuery,
  type SearchableFilterList,
} from '../customerFilterDictionaries.api';

interface CustomerSearchFilterProps {
  list: SearchableFilterList;
  /** A first choice for customers without a value, such as no own group. */
  noneOption?: TableFilterOption;
}

function useCustomerSearchOptions(
  { list, noneOption }: CustomerSearchFilterProps,
  { text, values }: FilterOptionSearch,
): LoadedFilterOptions {
  const { data, isFetching, isError } = useSearchFilterListQuery(
    text ? { list, name: text } : skipToken,
  );
  const picked = useMemo(
    () => values.filter((value) => value !== noneOption?.value),
    [noneOption, values],
  );
  // Without a cached search that found a picked entry, its id stands in for its name.
  const pickedLabels = useAppSelector(
    (state) => picked.map((value) => selectSearchedLabel(state, list, value) ?? value),
    shallowEqual,
  );

  return useMemo(() => {
    // A skipped query still returns its last result, which no longer matches the search.
    const found = (text ? data : undefined) ?? [];
    const pickedOptions = picked
      .map((value, index) => ({ value, label: pickedLabels[index] ?? value }))
      .filter((option) => !found.some((entry) => entry.value === option.value));
    return {
      options: [...(noneOption === undefined ? [] : [noneOption]), ...pickedOptions, ...found],
      loading: isFetching,
      failed: isError,
    };
  }, [data, isError, isFetching, noneOption, picked, pickedLabels, text]);
}

/**
 * Picks entries of a list too long to load whole: the service searches it by a part of the
 * name typed into the open list. Filters by the entries' ids.
 */
export const CustomerSearchFilter = createSearchMultiSelectFilter(useCustomerSearchOptions, {
  selectionLimit: MAX_FILTER_VALUES,
});
