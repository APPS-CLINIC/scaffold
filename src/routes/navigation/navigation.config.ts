import type { ComponentType } from 'react';
import { Settings } from 'ing-react-icons';
import type { MessageKey } from '@/i18n/messages/pl';

export type NavigationIconComponent = ComponentType<{ className?: string }>;
export type NavigationMatchMode = 'exact' | 'prefix';

export interface NavigationItemConfig {
  id: string;
  segment: string;
  labelKey: MessageKey;
  icon: NavigationIconComponent;
  match?: NavigationMatchMode;
  requiredPermissions?: readonly string[];
}

interface NavigationSectionInput<
  TKey extends string,
  TItems extends readonly NavigationItemConfig[],
> {
  key: TKey;
  path: `/${string}`;
  labelKey: MessageKey;
  items: TItems;
  defaultItemId?: TItems[number]['id'];
}

/**
 * Preserve literal section and item IDs while checking each declaration.
 * This is the only helper needed to add another configurable top-level area.
 */
function defineNavigationSection<
  const TKey extends string,
  const TItems extends readonly NavigationItemConfig[],
>(section: NavigationSectionInput<TKey, TItems>) {
  return section;
}

/**
 * Shared sidebar entry used when a top-level section has no dedicated menu.
 * Its empty segment resolves to the section root, so every application route
 * keeps a useful sidebar without duplicating fallback items per section.
 */
export const defaultNavigationItem = {
  id: 'overview',
  segment: '',
  labelKey: 'nav.sidebar.overview',
  icon: Settings,
  match: 'exact',
} satisfies NavigationItemConfig;

/**
 * Declarative source of truth for top tabs, contextual menu items and paths.
 * Route components stay in `router.tsx`; navigation metadata is configured once
 * here and consumed by the router, TopBar and contextual sidebar.
 */
export const navigationSections = [
  defineNavigationSection({
    key: 'home',
    path: '/',
    labelKey: 'nav.tab.start',
    items: [],
  }),
  defineNavigationSection({
    key: 'portfolio',
    path: '/portfolio',
    labelKey: 'nav.tab.portfolio',
    defaultItemId: 'dashboard',
    items: [
      {
        id: 'dashboard',
        segment: 'dashboard',
        labelKey: 'nav.portfolio.dashboard',
        icon: Settings,
      },
      {
        id: 'clients',
        segment: 'clients',
        labelKey: 'nav.portfolio.clients',
        icon: Settings,
      },
      {
        id: 'reviews',
        segment: 'reviews',
        labelKey: 'nav.portfolio.reviews',
        icon: Settings,
      },
      {
        id: 'ing-monitoring',
        segment: 'ing-monitoring',
        labelKey: 'nav.portfolio.ingMonitoring',
        icon: Settings,
      },
      {
        id: 'limits',
        segment: 'limits',
        labelKey: 'nav.portfolio.limits',
        icon: Settings,
      },
      {
        id: 'products',
        segment: 'products',
        labelKey: 'nav.portfolio.products',
        icon: Settings,
      },
      {
        id: 'financial-data',
        segment: 'financial-data',
        labelKey: 'nav.portfolio.financialData',
        icon: Settings,
      },
      {
        id: 'related-persons',
        segment: 'related-persons',
        labelKey: 'nav.portfolio.relatedPersons',
        icon: Settings,
      },
      {
        id: 'proxies',
        segment: 'proxies',
        labelKey: 'nav.portfolio.proxies',
        icon: Settings,
      },
      {
        id: 'iwa-documents',
        segment: 'iwa-documents',
        labelKey: 'nav.portfolio.iwaDocuments',
        icon: Settings,
      },
      {
        id: 'audit-process',
        segment: 'audit-process',
        labelKey: 'nav.portfolio.auditProcess',
        icon: Settings,
      },
    ],
  }),
  defineNavigationSection({
    key: 'clients',
    path: '/clients',
    labelKey: 'nav.tab.clients',
    defaultItemId: 'all-clients',
    items: [
      {
        id: 'all-clients',
        segment: 'all',
        labelKey: 'nav.clients.all',
        icon: Settings,
      },
      {
        id: 'client-advisors',
        segment: 'advisors',
        labelKey: 'nav.clients.advisors',
        icon: Settings,
      },
    ],
  }),
  defineNavigationSection({
    key: 'groups',
    path: '/groups',
    labelKey: 'nav.tab.groups',
    items: [],
  }),
  defineNavigationSection({
    key: 'targets',
    path: '/targets',
    labelKey: 'nav.tab.targets',
    items: [],
  }),
  defineNavigationSection({
    key: 'pipeline',
    path: '/pipeline',
    labelKey: 'nav.tab.pipeline',
    items: [],
  }),
  defineNavigationSection({
    key: 'orders',
    path: '/orders',
    labelKey: 'nav.tab.orders',
    items: [],
  }),
  defineNavigationSection({
    key: 'transactions',
    path: '/transactions',
    labelKey: 'nav.tab.transactions',
    items: [],
  }),
  defineNavigationSection({
    key: 'bi-reports',
    path: '/bi-reports',
    labelKey: 'nav.tab.reportsBi',
    items: [],
  }),
  defineNavigationSection({
    key: 'calendar',
    path: '/calendar',
    labelKey: 'nav.tab.calendar',
    items: [],
  }),
] as const;

export type NavigationSectionKey = NavigationSection['key'];
export type NavigationSection = NavigationSectionInput<
  (typeof navigationSections)[number]['key'],
  readonly NavigationItemConfig[]
>;
export type ConfiguredNavigationItem = NavigationItemConfig;
