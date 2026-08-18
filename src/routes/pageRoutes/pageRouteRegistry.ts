import type { NavigationSectionKey } from '@/routes/navigation';
import { customersDetailRoutes, customersPageRoutes } from './customers.pageRoutes';
import type {
  PageRouteDefinitions,
  PageRouteLoader,
  SectionDetailRoutes,
} from './pageRoutes.types';

/**
 * Route composition root. Add one entry per navigation section; each section
 * owns its page mappings in a separate module.
 */
const pageRouteDefinitions = {
  customers: customersPageRoutes,
} satisfies PageRouteDefinitions;

const sectionDetailRouteDefinitions: Partial<Record<NavigationSectionKey, SectionDetailRoutes>> = {
  customers: customersDetailRoutes,
};

/** Section-owned routes that are not navigation destinations (e.g. `:id`). */
export function getSectionDetailRoutes(sectionKey: NavigationSectionKey): SectionDetailRoutes {
  return sectionDetailRouteDefinitions[sectionKey] ?? [];
}

const pageRouteRegistry: Readonly<Record<string, Readonly<Record<string, PageRouteLoader>>>> =
  pageRouteDefinitions;

export function getPageRouteLoader(
  sectionKey: NavigationSectionKey,
  itemId: string,
): PageRouteLoader | undefined {
  return pageRouteRegistry[sectionKey]?.[itemId];
}
