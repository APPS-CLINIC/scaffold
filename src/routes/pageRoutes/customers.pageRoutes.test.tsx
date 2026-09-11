import { isValidElement } from 'react';
import { matchRoutes, type RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  getNavigationContextDefaultItemPath,
  navigationManifest,
  type NavigationTreeItemConfig,
} from '@/routes/navigation';
import { customerDetailPageRoutes, customersDetailRoutes } from './customers.pageRoutes';

function flattenItemIds(items: readonly NavigationTreeItemConfig[]): string[] {
  return items.flatMap((item) => [item.id, ...flattenItemIds(item.children ?? [])]);
}

function expectConfiguredPageLoaders(
  items: readonly NavigationTreeItemConfig[],
  routes: readonly RouteObject[],
): void {
  for (const item of items) {
    const route = routes.find((candidate) => candidate.path === item.segment);
    const destinationRoute = item.children?.length
      ? route?.children?.find((candidate) => candidate.index)
      : route;

    expect(destinationRoute?.lazy).toBe(
      customerDetailPageRoutes[item.id as keyof typeof customerDetailPageRoutes],
    );

    if (item.children?.length) {
      expectConfiguredPageLoaders(item.children, route?.children ?? []);
    }
  }
}

function createCustomerTestRoutes(): RouteObject[] {
  return [
    {
      path: '/customers',
      children: customersDetailRoutes.map(({ path, lazy, children }) => ({
        path,
        lazy,
        children: children ? [...children] : undefined,
      })),
    },
  ];
}

describe('customers detail routes', () => {
  const customerDetailNavigationContext = navigationManifest.sections.find(
    (section) => section.id === 'customers',
  )?.context;

  if (!customerDetailNavigationContext) {
    throw new Error('Expected the customer-detail navigation context.');
  }

  const dashboardItem = customerDetailNavigationContext.sidebar.items.find(
    (item) => item.id === 'dashboard',
  );
  const summaryItems = customerDetailNavigationContext.sidebar.items.filter(
    (item) => item.id !== 'dashboard',
  );

  if (!dashboardItem) {
    throw new Error('Expected the customer dashboard navigation item.');
  }

  it('derives every recursive customer route from the unified manifest context', () => {
    const customerRoute = customersDetailRoutes[0];
    const dashboardRoute = customerRoute?.children?.find(
      (route) => route.path === dashboardItem.segment,
    );
    const summaryLayoutRoute = customerRoute?.children?.find((route) =>
      route.id?.endsWith(':summary-layout'),
    );

    expect(dashboardRoute?.path).toBe(dashboardItem.segment);
    expect(summaryLayoutRoute?.path).toBeUndefined();
    const routedSummaryPaths =
      summaryLayoutRoute?.children
        ?.map((route) => route.path)
        .filter((path): path is string => typeof path === 'string' && path !== '*') ?? [];

    expect([...routedSummaryPaths].sort()).toEqual(summaryItems.map((item) => item.segment).sort());

    const reviewsItem = customerDetailNavigationContext.sidebar.items.find(
      (item) => item.id === 'reviews',
    );
    const reviewsRoute = summaryLayoutRoute?.children?.find((route) => route.path === 'reviews');
    const reviewChildren =
      reviewsRoute && 'children' in reviewsRoute ? reviewsRoute.children : undefined;

    expect(reviewChildren?.slice(1).map((route) => route.path)).toEqual(
      reviewsItem?.children?.map((item) => item.segment),
    );
  });

  it(
    'registers and attaches a lazy page for every configured context item',
    { timeout: 15_000 },
    async () => {
      const configuredIds = flattenItemIds(customerDetailNavigationContext.sidebar.items);
      const customerRoute = customersDetailRoutes[0];
      const summaryLayoutRoute = customerRoute?.children?.find((route) =>
        route.id?.endsWith(':summary-layout'),
      );

      expect(Object.keys(customerDetailPageRoutes).sort()).toEqual([...configuredIds].sort());
      expectConfiguredPageLoaders([dashboardItem], customerRoute?.children ?? []);
      expectConfiguredPageLoaders(summaryItems, summaryLayoutRoute?.children ?? []);

      const modules = await Promise.all(
        Object.values(customerDetailPageRoutes).map((load) => load()),
      );
      for (const routeModule of modules) {
        expect(routeModule.Component).toBeTypeOf('function');
      }
    },
  );

  it('redirects the bare customer route to the configured default item', () => {
    const matches = matchRoutes(createCustomerTestRoutes(), '/customers/42');
    const customerRoute = customersDetailRoutes[0];
    const defaultPath = getNavigationContextDefaultItemPath(customerDetailNavigationContext);
    const indexRoute = customerRoute?.children?.find((route) => route.index);

    expect(matches?.map((match) => match.route.path)).toEqual([
      '/customers',
      `:${customerDetailNavigationContext.parameter}`,
      undefined,
    ]);
    expect(matches?.at(-1)?.route.index).toBe(true);
    expect(defaultPath).toBe('general-data');
    expect(isValidElement<{ to: string; replace: boolean }>(indexRoute?.element)).toBe(true);
    if (!isValidElement<{ to: string; replace: boolean }>(indexRoute?.element)) {
      throw new Error('Expected a configured default navigation element.');
    }
    expect(indexRoute.element.props).toMatchObject({ to: defaultPath, replace: true });
  });

  it('matches the configured L3 branch below the persistent customer layout', () => {
    const matches = matchRoutes(createCustomerTestRoutes(), '/customers/42/reviews/details');

    expect(matches?.map((match) => match.route.path)).toEqual([
      '/customers',
      `:${customerDetailNavigationContext.parameter}`,
      undefined,
      'reviews',
      'details',
    ]);
  });

  it('keeps dashboard descendants outside the summary layout', () => {
    const matches = matchRoutes(createCustomerTestRoutes(), '/customers/42/dashboard/future');

    expect(matches?.map((match) => match.route.path)).toEqual([
      '/customers',
      `:${customerDetailNavigationContext.parameter}`,
      'dashboard/*',
    ]);
  });

  it('keeps an unconfigured L3+ deep link inside the customer layout', () => {
    const matches = matchRoutes(
      createCustomerTestRoutes(),
      '/customers/42/general-data/future-section/record-7',
    );

    expect(matches?.map((match) => match.route.path)).toEqual([
      '/customers',
      `:${customerDetailNavigationContext.parameter}`,
      undefined,
      '*',
    ]);
  });
});
