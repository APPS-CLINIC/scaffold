import type { RouteObject } from 'react-router-dom';
import type { NavigationTreeItemConfig } from '@/routes/navigation';
import { SectionPage } from '@/routes/pages/SectionPage';
import type { PageRouteLoader } from '@/routes/pageRoutes/pageRoutes.types';

interface BuildNavigationItemRoutesOptions {
  readonly routeIdPrefix: string;
  readonly getLazy?: (item: NavigationTreeItemConfig) => PageRouteLoader | undefined;
}

/**
 * Builds React Router branches from a navigation tree. Branch destinations
 * render their own content through an index route so nested destinations do
 * not depend on the parent page exposing an Outlet.
 */
export function buildNavigationItemRoutes(
  items: readonly NavigationTreeItemConfig[],
  options: BuildNavigationItemRoutesOptions,
): RouteObject[] {
  const buildItemRoute = (
    item: NavigationTreeItemConfig,
    ancestorIds: readonly string[],
  ): RouteObject => {
    const itemIdPath = [...ancestorIds, item.id];
    const routeId = [options.routeIdPrefix, ...itemIdPath].join(':');
    const lazy = options.getLazy?.(item);
    const children = item.children ?? [];

    if (children.length === 0) {
      return lazy
        ? { id: routeId, path: item.segment, caseSensitive: true, lazy }
        : {
            id: routeId,
            path: item.segment,
            caseSensitive: true,
            element: <SectionPage titleKey={item.labelKey} />,
          };
    }

    const indexRoute: RouteObject = lazy
      ? { id: `${routeId}:index`, index: true, lazy }
      : {
          id: `${routeId}:index`,
          index: true,
          element: <SectionPage titleKey={item.labelKey} />,
        };

    return {
      id: routeId,
      path: item.segment,
      caseSensitive: true,
      children: [indexRoute, ...children.map((child) => buildItemRoute(child, itemIdPath))],
    };
  };

  return items.map((item) => buildItemRoute(item, []));
}
