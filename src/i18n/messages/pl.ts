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
  'nav.title': 'Nawigacja',
  'nav.home': 'Start',
  'nav.tab.start': 'Start',
  'nav.tab.portfolio': 'Portfel',
  'nav.tab.clients': 'Klienci',
  'nav.tab.groups': 'Grupy',
  'nav.tab.targets': 'Targety',
  'nav.tab.pipeline': 'Pipeline',
  'nav.tab.orders': 'Zlecenia',
  'nav.tab.transactions': 'Transakcje',
  'nav.tab.reportsBi': 'Raporty BI',
  'nav.tab.calendar': 'Kalendarium',
  'topbar.recentlyViewed': 'Ostatnio przeglądane',
  'topbar.quickSearch': 'Szybkie wyszukiwanie',
  'topbar.myProfile': 'Mój profil',
  'topbar.settings': 'Ustawienia',
  'topbar.logout': 'Wyloguj',
  'section.placeholder': 'Prosta podstrona — dodaj tu właściwą treść.',
  'error.notFound': 'Ta strona nie istnieje.',
  'error.forbidden': 'Nie masz uprawnień do tej strony.',
  'error.goHome': 'Wróć na stronę główną',
  'footer.note': '© {{year}} Scaffold',
} as const;

export type MessageKey = keyof typeof pl;
