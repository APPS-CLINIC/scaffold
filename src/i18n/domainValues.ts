/**
 * Backend domain vocabularies arrive as free-form (sometimes Polish) labels.
 * The normalization tables live next to the translation catalog on purpose:
 * when the backend vocabulary changes, both the mapping and the visible
 * translations are maintained in one place.
 *
 * Accepting Polish labels at all is a documented backend quirk — the data
 * team tracks replacing them with stable identifiers (or booleans) in the
 * database documentation.
 */
export const DOMAIN_LOCALE = 'pl-PL';

export function normalizeDomainValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase(DOMAIN_LOCALE)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Keys are `normalizeDomainValue` outputs. Note `wygasł` next to `wygasl`:
 * the stroke in `ł` is not a combining diacritic, so NFKD keeps it intact.
 */
export const customerStatusByDomainValue: Readonly<Record<string, 'active' | 'inactive'>> = {
  active: 'active',
  aktywny: 'active',
  inactive: 'inactive',
  nieaktywny: 'inactive',
};

export const priceConditionStatusByDomainValue: Readonly<
  Record<string, 'valid' | 'expiring' | 'expired'>
> = {
  valid: 'valid',
  wazny: 'valid',
  expiring: 'expiring',
  'wkrotce wygasa': 'expiring',
  expired: 'expired',
  wygasl: 'expired',
  wygasł: 'expired',
};
