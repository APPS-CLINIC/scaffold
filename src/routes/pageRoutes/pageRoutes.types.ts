import type { RouteObject } from 'react-router-dom';
import type { navigationSections, NavigationSectionKey } from '@/routes/navigation';

type ConfiguredNavigationSection = (typeof navigationSections)[number];

type NavigationItemIdFor<TKey extends NavigationSectionKey> = Extract<
  ConfiguredNavigationSection,
  { readonly key: TKey }
>['items'][number]['id'];

type NavigationSectionWithItems = {
  [TKey in NavigationSectionKey]: [NavigationItemIdFor<TKey>] extends [never] ? never : TKey;
}[NavigationSectionKey];

export type PageRouteLoader = NonNullable<RouteObject['lazy']>;

export type SectionPageRoutes<TKey extends NavigationSectionWithItems> = Readonly<
  Partial<Record<NavigationItemIdFor<TKey>, PageRouteLoader>>
>;

export type PageRouteDefinitions = {
  readonly [TKey in NavigationSectionWithItems]?: SectionPageRoutes<TKey>;
};
