import { apiRootBaseQuery, baseApi } from '@/api/baseApi';

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

export interface DictionaryEntry {
  code: string;
  label: string;
}

/** Every dictionary of one language by its name; one the service leaves out is missing. */
export type StaticDictionaries = Partial<Record<string, readonly DictionaryEntry[]>>;

export const dictionariesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Every static dictionary, labelled in `language`, or in Polish when the service has none in it. */
    getStaticDictionaries: builder.query<StaticDictionaries, string>({
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
        return { data: result.data as StaticDictionaries };
      },
      keepUnusedDataFor: DICTIONARY_CACHE_SECONDS,
    }),
  }),
});

export const { useGetStaticDictionariesQuery } = dictionariesApi;
