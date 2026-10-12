/** Made-up answers of the dictionary endpoints, shaped like the service's. */

interface Entry {
  id: number;
  name: string;
}

const entries = (firstId: number, names: readonly string[]): Entry[] =>
  names.map((name, index) => ({ id: firstId + index, name }));

/** `GET /api/dictionaries` by `Accept-Language`; any other language gets 400. */
export const staticDictionariesByLanguage: Record<
  string,
  Record<string, { code: string; label: string }[]>
> = {
  pl: {
    'customer-status': [
      { code: 'ACTIVE', label: 'Aktywny' },
      { code: 'ARCHIVAL', label: 'Archiwalny' },
    ],
    'customer-type': [
      { code: 'CORPORATE', label: 'Corporate' },
      { code: 'INVESTMENT_BANK', label: 'Bank Inwestycyjny' },
    ],
    'ts-price-condition-status': [
      {
        code: 'STANDARD_CONTRACT_END_DATE',
        label: '1 - Data Końcowa w umowie, zapisy standardowe',
      },
      { code: 'NO_CONTRACT_END_DATE', label: '3 - Brak Daty Końcowej w umowie, brak zapisów' },
    ],
  },
  en: {
    'customer-status': [
      { code: 'ACTIVE', label: 'Active' },
      { code: 'ARCHIVAL', label: 'Archival' },
    ],
    'customer-type': [
      { code: 'CORPORATE', label: 'Corporate' },
      { code: 'INVESTMENT_BANK', label: 'Investment bank' },
    ],
    'ts-price-condition-status': [
      { code: 'STANDARD_CONTRACT_END_DATE', label: '1 - Contract end date, standard terms' },
      { code: 'NO_CONTRACT_END_DATE', label: '3 - No contract end date, no terms' },
    ],
  },
};

/** `GET /api/v1/internalGroups` and `/corporateGroups`, before the `name` search. */
export const groupsByList: Record<string, Entry[]> = {
  internalGroups: entries(11, ['Grupa Północ', 'Grupa Południe', 'Grupa Centrum']),
  corporateGroups: entries(21, ['ArcelorMittal', 'Comarch', 'ABB']),
};

/** `GET /api/v1/teams`. */
export const lendingTeams: Entry[] = entries(1, ['Zespół Warszawa', 'Zespół Kraków']);

/** `GET /api/v1/users` by `advisorType`. */
export const advisorsByType: Record<string, Entry[]> = {
  RM: entries(101, ['Kowalska Anna', 'Nowak Piotr', 'Wiśniewski Tomasz']),
  LENDING: entries(201, ['Drewniak Dariusz', 'Zając Monika']),
  SF: entries(301, ['Lewandowska Ewa']),
  PCM: entries(401, ['Wójcik Agnieszka']),
  FM: entries(501, ['Kozłowski Adam']),
  TS: entries(601, ['Mazur Krzysztof']),
  IMPLEMENTATION: entries(701, ['Piotrowski Jan']),
  CUSTOMER_SERVICE: entries(801, ['Pawlak Barbara']),
  EBD: entries(901, ['Król Michał']),
};
