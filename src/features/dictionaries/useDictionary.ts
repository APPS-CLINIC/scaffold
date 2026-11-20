import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetStaticDictionariesQuery,
  type DictionaryEntry,
  type StaticDictionary,
} from './dictionaries.api';

export interface Dictionary {
  /** The entries in the service's order; empty until they load. */
  entries: readonly DictionaryEntry[];
  /** The label of `code`, or `undefined` when the dictionary has no such code or is not loaded. */
  labelOf: (code: string | null | undefined) => string | undefined;
  loading: boolean;
  failed: boolean;
}

const NO_ENTRIES: readonly DictionaryEntry[] = [];

/** Every view reads the dictionaries of the current language from one cached request. */
function useStaticDictionaries() {
  const { i18n } = useTranslation();
  return useGetStaticDictionariesQuery(i18n.resolvedLanguage ?? i18n.language);
}

/** One static dictionary in the current language. A language change loads its labels again. */
export function useDictionary(dictionary: StaticDictionary): Dictionary {
  const { data, isLoading, isError } = useStaticDictionaries();
  const entries = data?.[dictionary] ?? NO_ENTRIES;

  return useMemo(() => {
    const labels = new Map(entries.map(({ code, label }) => [code, label]));
    return {
      entries,
      labelOf: (code) => (code == null ? undefined : labels.get(code)),
      loading: isLoading,
      failed: isError,
    };
  }, [entries, isError, isLoading]);
}

/** Starts loading the dictionaries when the app opens, so the views find them cached. */
export function usePreloadDictionaries(): void {
  useStaticDictionaries();
}
