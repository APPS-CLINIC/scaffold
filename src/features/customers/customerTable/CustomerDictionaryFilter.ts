import { useMemo } from 'react';
import { MAX_FILTER_VALUES } from '@/features/urlState/urlState.schema';
import { createMultiSelectFilter, type TableFilterOption } from '@/ui';
import {
  useGetCustomerFilterDictionaryQuery,
  type CustomerFilterDictionary,
} from '../customerFilterDictionaries.api';

interface CustomerDictionaryFilterProps {
  dictionary: CustomerFilterDictionary;
  /** A first choice for customers without a value, such as no own group. */
  noneOption?: TableFilterOption;
}

function useCustomerDictionaryOptions({
  dictionary,
  noneOption,
}: CustomerDictionaryFilterProps): readonly TableFilterOption[] {
  const { data } = useGetCustomerFilterDictionaryQuery(dictionary);
  return useMemo(
    () => [
      ...(noneOption === undefined ? [] : [noneOption]),
      ...(data ?? []).map(({ id, name }) => ({ value: id, label: name })),
    ],
    [data, noneOption],
  );
}

/** Picks entries of a customer dictionary by name and filters by their ids. */
export const CustomerDictionaryFilter = createMultiSelectFilter(useCustomerDictionaryOptions, {
  selectionLimit: MAX_FILTER_VALUES,
});
