import type { MessageKey } from '@/i18n/messages/pl';

/**
 * Single source of truth for the top-bar tabs: order (= TabMenu index),
 * route path and i18n label. Both the router and the TopBar render from this
 * list, and the URL mirror derives `activeTab` from it — adding a tab here is
 * the only step needed to wire a new section.
 */
export const navTabs = [
  { key: 'start', path: '/', labelKey: 'nav.tab.start' },
  { key: 'portfel', path: '/portfel', labelKey: 'nav.tab.portfolio' },
  { key: 'klienci', path: '/klienci', labelKey: 'nav.tab.clients' },
  { key: 'grupy', path: '/grupy', labelKey: 'nav.tab.groups' },
  { key: 'targety', path: '/targety', labelKey: 'nav.tab.targets' },
  { key: 'pipeline', path: '/pipeline', labelKey: 'nav.tab.pipeline' },
  { key: 'zlecenia', path: '/zlecenia', labelKey: 'nav.tab.orders' },
  { key: 'transakcje', path: '/transakcje', labelKey: 'nav.tab.transactions' },
  { key: 'raporty-bi', path: '/raporty-bi', labelKey: 'nav.tab.reportsBi' },
  { key: 'kalendarium', path: '/kalendarium', labelKey: 'nav.tab.calendar' },
] as const satisfies readonly { key: string; path: string; labelKey: MessageKey }[];

export type NavTabKey = (typeof navTabs)[number]['key'];

export const defaultNavTabKey: NavTabKey = 'start';

/**
 * Derive the active tab from a pathname. Nested paths stay within their
 * section (`/klienci/42` -> `klienci`); unknown paths fall back to `start`
 * so the mirror is total, like the rest of the URL parsing.
 */
export function parseActiveTab(pathname: string): NavTabKey {
  const match = navTabs.find(
    (tab) => tab.path !== '/' && (pathname === tab.path || pathname.startsWith(`${tab.path}/`)),
  );
  return match?.key ?? defaultNavTabKey;
}
