import type { RouteObject } from 'react-router-dom';
import type { navigationManifest, NavigationSectionKey } from '@/routes/navigation';

type ConfiguredNavigationSection = (typeof navigationManifest.sections)[number];

type ChildNavigationItemId<TItem> = TItem extends {
  readonly children: infer TChildren extends readonly unknown[];
}
  ? NavigationItemId<TChildren[number]>
  : never;

type NavigationItemId<TItem> = TItem extends { readonly id: infer TId extends string }
  ? TId | ChildNavigationItemId<TItem>
  : never;

type NavigationItemIdFor<TKey extends NavigationSectionKey> = NavigationItemId<
  Extract<ConfiguredNavigationSection, { readonly id: TKey }>['sidebar']['items'][number]
>;

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

/**
 * A section-owned route that is not a navigation destination — e.g. a
 * details page like `/customers/:id`. Declared next to the section's page
 * map and appended to the router after the navigation-generated routes.
 *
 * `children` lets a detail route own a nested route tree (for example the
 * customer context below its runtime id). Navigation segments can be derived
 * from the manifest while page elements and lazy loaders remain plain React
 * Router objects outside navigation metadata.
 */
export interface DetailPageRoute {
  readonly path: string;
  readonly lazy: PageRouteLoader;
  readonly children?: readonly RouteObject[];
}

export type SectionDetailRoutes = readonly DetailPageRoute[];
