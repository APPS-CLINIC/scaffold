import { baseApi } from '@/api/baseApi';

/** One choice of a dictionary: the filter sends `id`, the user sees `name`. */
interface DictionaryEntry {
  id: string;
  name: string;
}

const advisors = (role: string, names: readonly string[]): readonly DictionaryEntry[] =>
  names.map((name, index) => ({ id: `${role}-${index + 1}`, name }));

/** Stand-in dictionaries for the filters until the service serves them. */
const localDictionaries = {
  internalGroups: [
    { id: '101', name: 'Grupa Północ' },
    { id: '102', name: 'Grupa Południe' },
    { id: '103', name: 'Grupa Centrum' },
  ],
  corporateGroups: [
    { id: '201', name: 'ArcelorMittal' },
    { id: '202', name: 'Comarch' },
    { id: '203', name: 'ABB' },
  ],
  rmAdvisors: advisors('rm', ['Kowalska Anna', 'Nowak Piotr', 'Wiśniewski Tomasz']),
  lendingAdvisors: advisors('lending', ['Drewniak Dariusz', 'Zając Monika']),
  sfAdvisors: advisors('sf', ['Lewandowska Ewa', 'Kamiński Marek']),
  pcmAdvisors: advisors('pcm', ['Wójcik Agnieszka', 'Kowalczyk Paweł']),
  fmAdvisors: advisors('fm', ['Kozłowski Adam', 'Jankowska Joanna']),
  tsAdvisors: advisors('ts', ['Mazur Krzysztof', 'Krawczyk Magdalena']),
  implementationAdvisors: advisors('implementation', ['Piotrowski Jan', 'Grabowska Karolina']),
  customerServiceAdvisors: advisors('customer-service', ['Pawlak Barbara', 'Michalski Robert']),
  ebdAdvisors: advisors('ebd', ['Król Michał', 'Wieczorek Natalia']),
  lendingTeams: [
    { id: 'team-1', name: 'Zespół Warszawa' },
    { id: 'team-2', name: 'Zespół Kraków' },
    { id: 'team-3', name: 'Zespół Poznań' },
  ],
} satisfies Record<string, readonly DictionaryEntry[]>;

/** The lists the customer filters choose from. */
export type CustomerFilterDictionary = keyof typeof localDictionaries;

export const customerFilterDictionariesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerFilterDictionary: builder.query<
      readonly DictionaryEntry[],
      CustomerFilterDictionary
    >({
      queryFn: (dictionary) => ({ data: localDictionaries[dictionary] }),
    }),
  }),
});

export const { useGetCustomerFilterDictionaryQuery } = customerFilterDictionariesApi;
