import type { NavigationSectionKey } from '@/routes/navigation';
import { customersPageRoutes } from './customers.pageRoutes';
import type { PageRouteDefinitions, PageRouteLoader } from './pageRoutes.types';

/**
 * Route composition root. Add one entry per navigation section; each section
 * owns its page mappings in a separate module.
 */
const pageRouteDefinitions = {
  customers: customersPageRoutes,
} satisfies PageRouteDefinitions;

const pageRouteRegistry: Readonly<Record<string, Readonly<Record<string, PageRouteLoader>>>> =
  pageRouteDefinitions;

export function getPageRouteLoader(
  sectionKey: NavigationSectionKey,
  itemId: string,
): PageRouteLoader | undefined {
  return pageRouteRegistry[sectionKey]?.[itemId];
}
