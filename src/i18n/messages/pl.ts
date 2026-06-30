/**
 * Polish messages — the canonical catalog. Its keys define `MessageKey`, and
 * every other locale must provide the same keys (enforced via `Record<MessageKey, string>`).
 *
 * Keep keys dotted and namespaced by area. Only *static UI* text lives here;
 * domain data is expected to arrive already localized from the backend
 * (see docs/adr/0014-internationalization-i18n.md).
 */
export const pl = {
  'app.title': 'Scaffold',
  'common.search': 'Szukaj',
  'common.loading': 'Ładowanie…',
  'common.empty': 'Brak danych',
  'common.results': '{{count}} wyników',
  'home.intro': 'Czysty scaffold — dodaj swoją pierwszą funkcję.',
} as const;

export type MessageKey = keyof typeof pl;
