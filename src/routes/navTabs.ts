import {
  defaultNavigationSectionKey,
  getActiveNavigationSection,
  navigationSections,
  type NavigationSectionKey,
} from './navigation';

/**
 * Single source of truth for the top-bar tabs: order (= TabMenu index),
 * route path and i18n label. Both the router and the TopBar render from this
 * list, and the URL route mirror derives its section from it — adding a tab
 * here is the only step needed to wire a new section.
 */
export const navTabs = navigationSections;

export type NavTabKey = NavigationSectionKey;

export const defaultNavTabKey: NavTabKey = defaultNavigationSectionKey;

/**
 * Derive the active tab from a pathname. Nested paths stay within their
 * section (`/clients/42` -> `clients`); unknown paths fall back to `home`
 * so the mirror is total, like the rest of the URL parsing.
 */
export function parseActiveTab(pathname: string): NavTabKey {
  const match = getActiveNavigationSection(pathname);
  return match?.key ?? defaultNavTabKey;
}
