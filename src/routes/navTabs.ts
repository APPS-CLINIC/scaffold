import type { MessageKey } from '@/i18n/messages/pl';

/**
 * Single source of truth for the top-bar tabs: order (= TabMenu index),
 * route path and i18n label. Both the router and the TopBar render from this
 * list, and the URL mirror derives `activeTab` from it — adding a tab here is
 * the only step needed to wire a new section.
 */
export const navTabs = [
  { key: 'home', path: '/', labelKey: 'nav.tab.start' },
  { key: 'portfolio', path: '/portfolio', labelKey: 'nav.tab.portfolio' },
  { key: 'clients', path: '/clients', labelKey: 'nav.tab.clients' },
  { key: 'groups', path: '/groups', labelKey: 'nav.tab.groups' },
  { key: 'targets', path: '/targets', labelKey: 'nav.tab.targets' },
  { key: 'pipeline', path: '/pipeline', labelKey: 'nav.tab.pipeline' },
  { key: 'orders', path: '/orders', labelKey: 'nav.tab.orders' },
  { key: 'transactions', path: '/transactions', labelKey: 'nav.tab.transactions' },
  { key: 'bi-reports', path: '/bi-reports', labelKey: 'nav.tab.reportsBi' },
  { key: 'calendar', path: '/calendar', labelKey: 'nav.tab.calendar' },
] as const satisfies readonly { key: string; path: string; labelKey: MessageKey }[];

export type NavTabKey = (typeof navTabs)[number]['key'];

export const defaultNavTabKey: NavTabKey = 'home';

/**
 * Derive the active tab from a pathname. Nested paths stay within their
 * section (`/clients/42` -> `clients`); unknown paths fall back to `home`
 * so the mirror is total, like the rest of the URL parsing.
 */
export function parseActiveTab(pathname: string): NavTabKey {
  const match = navTabs.find(
    (tab) => tab.path !== '/' && (pathname === tab.path || pathname.startsWith(`${tab.path}/`)),
  );
  return match?.key ?? defaultNavTabKey;
}
