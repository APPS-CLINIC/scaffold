import { resolveNavigation, type NavigationSectionKey } from '@/routes/navigation';

/**
 * Serializable identity of the content selected by the current pathname.
 * `pathname` is retained because two deeper URLs may resolve to the same
 * sidebar item while still representing different screens or entities.
 */
export interface UrlRouteState {
  pathname: string;
  sectionKey: NavigationSectionKey;
  itemId: string | null;
}

export function parseUrlRouteState(pathname: string): UrlRouteState {
  const resolved = resolveNavigation(pathname);

  return {
    pathname,
    sectionKey: resolved.route.sectionKey,
    itemId: resolved.route.activeItemId,
  };
}

export const defaultUrlRouteState = parseUrlRouteState('/');
