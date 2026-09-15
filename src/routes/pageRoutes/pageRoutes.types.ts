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
 * Section-owned routes that are not navigation destinations — e.g. the customer detail tree below
 * `/customers/:id`. Hand-written per section (see `customers.pageRoutes.tsx`) and appended to the
 * router after the navigation-generated routes.
 */
export type SectionDetailRoutes = readonly RouteObject[];
