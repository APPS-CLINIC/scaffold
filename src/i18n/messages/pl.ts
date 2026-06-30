/**
 * Polish messages — the canonical catalog. Its keys define `MessageKey`, and
 * every other locale must provide the same keys (enforced via `Record<MessageKey, string>`).
 *
 * Keep keys dotted and namespaced by area. Only *static UI* text lives here;
 * domain data is expected to arrive already localized from the backend
 * (see docs/adr/0014-internationalization-i18n.md).
 */
export const pl = {
  'app.title': 'BIX',
  'nav.portfolio': 'Portfel',
  'nav.clients': 'Klienci',
  'common.search': 'Szukaj',
  'common.loading': 'Ładowanie…',
  'common.empty': 'Brak danych',
  'home.intro': 'Czysty scaffold — dodaj swoją pierwszą funkcję.',
  'entity.client': 'Klient',
  'entity.capitalGroup': 'Grupa kapitałowa',
  'entity.ownGroup': 'Grupa własna',
  'entity.count': '{count} podmiotów',
} as const;

export type MessageKey = keyof typeof pl;
