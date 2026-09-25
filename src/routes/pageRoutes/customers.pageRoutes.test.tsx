import { matchRoutes, type RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  getNavigationContextDefaultItemPath,
  navigationManifest,
  type NavigationTreeItemConfig,
} from '@/routes/navigation';
import type { PageRouteLoader } from './pageRoutes.types';
import { customersDetailRoutes } from './customers.pageRoutes';

/** Flattens a manifest sidebar tree into `parent/child` path strings. */
function manifestPaths(items: readonly NavigationTreeItemConfig[], prefix = ''): string[] {
  return items.flatMap((item) => [
    `${prefix}${item.segment}`,
    ...manifestPaths(item.children ?? [], `${prefix}${item.segment}/`),
  ]);
}

/** Flattens a route tree into the same `parent/child` shape, skipping index/pathless/'*' routes. */
function routedPaths(routes: readonly RouteObject[], prefix = ''): string[] {
  return routes.flatMap((route) => {
    const own =
      route.path && route.path !== '*' ? `${prefix}${route.path.replace(/\/\*$/, '')}` : undefined;

    return [...(own ? [own] : []), ...routedPaths(route.children ?? [], own ? `${own}/` : prefix)];
  });
}

/** Every route carrying a real `path` other than the catch-all, anywhere in the tree. */
function nonWildcardRoutes(routes: readonly RouteObject[]): RouteObject[] {
  return routes.flatMap((route) => [
    ...(route.path && route.path !== '*' ? [route] : []),
    ...nonWildcardRoutes(route.children ?? []),
  ]);
}

/** Every `lazy` loader anywhere in the tree. */
function lazyLoaders(routes: readonly RouteObject[]): PageRouteLoader[] {
  return routes.flatMap((route) => [
    ...(route.lazy ? [route.lazy] : []),
    ...lazyLoaders(route.children ?? []),
  ]);
}

function createCustomerTestRoutes(): RouteObject[] {
  return [{ path: '/customers', children: [...customersDetailRoutes] }];
}

describe('customers detail routes', () => {
  const customerDetailNavigationContext = navigationManifest.sections.find(
    (section) => section.id === 'customers',
  )?.context;

  if (!customerDetailNavigationContext) {
    throw new Error('Expected the customer-detail navigation context.');
  }

  it('routes exactly the manifest customer-context segments below :id', () => {
    const detail = customersDetailRoutes[0];

    expect(detail?.path).toBe(`:${customerDetailNavigationContext.parameter}`);
    expect(routedPaths(detail?.children ?? []).sort()).toEqual(
      manifestPaths(customerDetailNavigationContext.sidebar.items).sort(),
    );
  });

  it('redirects the index route to the manifest-configured default item', () => {
    const detail = customersDetailRoutes[0];
    const index = detail?.children?.find((route) => route.index);
    const defaultPath = getNavigationContextDefaultItemPath(customerDetailNavigationContext);

    expect(defaultPath).toBe('general-data');
    expect(index?.element).toMatchObject({ props: { to: defaultPath, replace: true } });
  });

  it('marks every route with a real path caseSensitive', () => {
    const routes = nonWildcardRoutes(customersDetailRoutes);

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      expect(route.caseSensitive).toBe(true);
    }
  });

  it('matches dashboard and its descendants outside the summary layout', () => {
    for (const pathname of ['/customers/42/dashboard', '/customers/42/dashboard/future']) {
      const matches = matchRoutes(createCustomerTestRoutes(), pathname);

      expect(matches?.map((match) => match.route.path)).toEqual([
        '/customers',
        `:${customerDetailNavigationContext.parameter}`,
        'dashboard/*',
      ]);
    }
  });

  it('keeps every FM data part inside the summary layout', () => {
    for (const pathname of [
      '/customers/42/fm-data',
      '/customers/42/fm-data/basic-data',
      '/customers/42/fm-data/mandates',
    ]) {
      const matches = matchRoutes(createCustomerTestRoutes(), pathname);

      expect(matches?.map((match) => match.route.path)).toEqual([
        '/customers',
        `:${customerDetailNavigationContext.parameter}`,
        undefined,
        'fm-data/*',
      ]);
    }
  });

  it('keeps every reviews part inside the summary layout', () => {
    for (const pathname of [
      '/customers/42/reviews',
      '/customers/42/reviews/review-dates',
      '/customers/42/reviews/facilities',
    ]) {
      const matches = matchRoutes(createCustomerTestRoutes(), pathname);

      expect(matches?.map((match) => match.route.path)).toEqual([
        '/customers',
        `:${customerDetailNavigationContext.parameter}`,
        undefined,
        'reviews/*',
      ]);
    }
  });

  it('keeps an unconfigured deep link and non-canonical casing inside the customer layout', () => {
    for (const pathname of [
      '/customers/42/general-data/future-section/record-7',
      '/customers/42/GENERAL-DATA',
      '/customers/42/DASHBOARD',
    ]) {
      const matches = matchRoutes(createCustomerTestRoutes(), pathname);

      expect(matches?.map((match) => match.route.path)).toEqual([
        '/customers',
        `:${customerDetailNavigationContext.parameter}`,
        undefined,
        '*',
      ]);
    }
  });

  it('resolves a Component for every lazy route in the tree', { timeout: 15_000 }, async () => {
    const loaders = lazyLoaders(customersDetailRoutes);

    expect(loaders.length).toBeGreaterThan(0);
    const modules = await Promise.all(loaders.map((load) => load()));
    for (const routeModule of modules) {
      expect(routeModule.Component).toBeTypeOf('function');
    }
  });
});
