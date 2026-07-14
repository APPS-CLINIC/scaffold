import type { MessageKey } from './pl';

/**
 * English messages. Typed as `Record<MessageKey, string>` so the compiler fails
 * the build if a key is missing or misspelled relative to the Polish catalog.
 */
export const en: Record<MessageKey, string> = {
  'app.title': 'Scaffold',
  'common.search': 'Search',
  'common.loading': 'Loading…',
  'common.empty': 'No data',
  'common.results': '{{count}} results',
  'home.intro': 'Clean scaffold — add your first feature.',
  'nav.title': 'Navigation',
  'nav.home': 'Home',
  'nav.tab.start': 'Home',
  'nav.tab.portfolio': 'Portfolio',
  'nav.tab.clients': 'Clients',
  'nav.tab.groups': 'Groups',
  'nav.tab.targets': 'Targets',
  'nav.tab.pipeline': 'Pipeline',
  'nav.tab.orders': 'Orders',
  'nav.tab.transactions': 'Transactions',
  'nav.tab.reportsBi': 'BI Reports',
  'nav.tab.calendar': 'Calendar',
  'topbar.recentlyViewed': 'Recently viewed',
  'topbar.quickSearch': 'Quick search',
  'topbar.myProfile': 'My profile',
  'topbar.settings': 'Settings',
  'topbar.logout': 'Log out',
  'section.placeholder': 'Simple subpage — add the real content here.',
  'footer.note': '© {{year}} Scaffold',
};
