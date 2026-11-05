import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_FILTER_VALUES } from '@/features/urlState/urlState.schema';
import { createMultiSelectFilter, type LoadedFilterOptions, type TableFilterOption } from '@/ui';
import {
  useGetStaticDictionariesQuery,
  type StaticDictionary,
} from '../customerFilterDictionaries.api';

interface CustomerDictionaryFilterProps {
  dictionary: StaticDictionary;
  /** A first choice for customers without a value, such as no TS status. */
  noneOption?: TableFilterOption;
}

function useCustomerDictionaryOptions({
  dictionary,
  noneOption,
}: CustomerDictionaryFilterProps): LoadedFilterOptions {
  const { i18n } = useTranslation();
  const { data, isLoading, isError } = useGetStaticDictionariesQuery(
    i18n.resolvedLanguage ?? i18n.language,
  );
  const entries = data?.[dictionary];

  return useMemo(
    () => ({
      options: [...(noneOption === undefined ? [] : [noneOption]), ...(entries ?? [])],
      loading: isLoading,
      failed: isError,
    }),
    [entries, isError, isLoading, noneOption],
  );
}

/** Picks entries of a dictionary the service serves whole, by label, and filters by their codes. */
export const CustomerDictionaryFilter = createMultiSelectFilter(useCustomerDictionaryOptions, {
  selectionLimit: MAX_FILTER_VALUES,
});
