import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useTranslation } from 'react-i18next';
import { MAX_FILTER_VALUES } from '@/features/urlState/urlState.schema';
import { createMultiSelectFilter, type LoadedFilterOptions, type TableFilterOption } from '@/ui';
import {
  STATIC_DICTIONARIES,
  useGetFilterListQuery,
  useGetStaticDictionariesQuery,
  type FilterList,
  type StaticDictionary,
} from '../customerFilterDictionaries.api';

interface CustomerDictionaryFilterProps {
  dictionary: StaticDictionary | FilterList;
  /** A first choice for customers without a value, such as no advisor. */
  noneOption?: TableFilterOption;
}

function isStaticDictionary(dictionary: string): dictionary is StaticDictionary {
  return (STATIC_DICTIONARIES as readonly string[]).includes(dictionary);
}

function useCustomerDictionaryOptions({
  dictionary,
  noneOption,
}: CustomerDictionaryFilterProps): LoadedFilterOptions {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const staticDictionaries = useGetStaticDictionariesQuery(
    isStaticDictionary(dictionary) ? language : skipToken,
  );
  const list = useGetFilterListQuery(isStaticDictionary(dictionary) ? skipToken : dictionary);
  const { data, isLoading, isError } = isStaticDictionary(dictionary)
    ? { ...staticDictionaries, data: staticDictionaries.data?.[dictionary] }
    : list;

  return useMemo(
    () => ({
      options: [...(noneOption === undefined ? [] : [noneOption]), ...(data ?? [])],
      loading: isLoading,
      failed: isError,
    }),
    [data, isError, isLoading, noneOption],
  );
}

/** Picks entries of a dictionary the service serves whole, by label, and filters by their codes or ids. */
export const CustomerDictionaryFilter = createMultiSelectFilter(useCustomerDictionaryOptions, {
  selectionLimit: MAX_FILTER_VALUES,
});
