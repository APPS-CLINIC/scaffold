import { defaultNavTabKey, type NavTabKey } from '@/routes/navTabs';
import { getActiveNavigationItem, getActiveNavigationSection } from '@/routes/navigation';

/**
 * Serializable identity of the content selected by the current pathname.
 * `pathname` is retained because two deeper URLs may resolve to the same
 * sidebar item while still representing different screens or entities.
 */
export interface UrlRouteState {
  pathname: string;
  sectionKey: NavTabKey;
  itemId: string | null;
}

export function parseUrlRouteState(pathname: string): UrlRouteState {
  const section = getActiveNavigationSection(pathname);

  if (!section) {
    return {
      pathname,
      sectionKey: defaultNavTabKey,
      itemId: null,
    };
  }

  return {
    pathname,
    sectionKey: section.key,
    itemId: getActiveNavigationItem(section, pathname)?.id ?? null,
  };
}

export const defaultUrlRouteState = parseUrlRouteState('/');
