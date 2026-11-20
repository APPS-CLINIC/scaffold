import { useMemo } from 'react';
import { useDictionary, type StaticDictionary } from '@/features/dictionaries';
import { MAX_FILTER_VALUES } from '@/features/urlState/urlState.schema';
import { createMultiSelectFilter, type LoadedFilterOptions, type TableFilterOption } from '@/ui';

interface CustomerDictionaryFilterProps {
  dictionary: StaticDictionary;
  /** A first choice for customers without a value, such as no TS status. */
  noneOption?: TableFilterOption;
}

function useCustomerDictionaryOptions({
  dictionary,
  noneOption,
}: CustomerDictionaryFilterProps): LoadedFilterOptions {
  const { entries, loading, failed } = useDictionary(dictionary);

  return useMemo(
    () => ({
      options: [
        ...(noneOption === undefined ? [] : [noneOption]),
        ...entries.map(({ code, label }) => ({ value: code, label })),
      ],
      loading,
      failed,
    }),
    [entries, failed, loading, noneOption],
  );
}

/** Picks entries of a dictionary the service serves whole, by label, and filters by their codes. */
export const CustomerDictionaryFilter = createMultiSelectFilter(useCustomerDictionaryOptions, {
  selectionLimit: MAX_FILTER_VALUES,
});
