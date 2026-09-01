import { Settings } from 'ing-react-icons';
import { matchRoutes, type RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { NavigationTreeItemConfig } from '@/routes/navigation';
import type { PageRouteLoader } from '@/routes/pageRoutes/pageRoutes.types';
import { buildNavigationItemRoutes } from './buildNavigationItemRoutes';

const configuredItems = [
  {
    id: 'reports',
    segment: 'reports',
    labelKey: 'nav.tab.reportsBi',
    icon: Settings,
    children: [
      {
        id: 'monthly',
        segment: 'monthly',
        labelKey: 'nav.sidebar.overview',
        icon: Settings,
        children: [
          {
            id: 'record',
            segment: 'record',
            labelKey: 'nav.sidebar.overview',
            icon: Settings,
          },
        ],
      },
    ],
  },
] as const satisfies readonly NavigationTreeItemConfig[];

function createConfiguredGlobalRoutes(): RouteObject[] {
  return [
    {
      path: '/configured',
      caseSensitive: true,
      children: buildNavigationItemRoutes(configuredItems, {
        routeIdPrefix: 'section:configured',
      }),
    },
  ];
}

describe('buildNavigationItemRoutes', () => {
  it('matches every level of a recursively configured global sidebar branch', () => {
    const matches = matchRoutes(
      createConfiguredGlobalRoutes(),
      '/configured/reports/monthly/record',
    );

    expect(matches?.map((match) => match.route.path)).toEqual([
      '/configured',
      'reports',
      'monthly',
      'record',
    ]);
    expect(matches?.map((match) => match.route.id)).toEqual([
      undefined,
      'section:configured:reports',
      'section:configured:reports:monthly',
      'section:configured:reports:monthly:record',
    ]);
  });

  it('uses the branch index route for the branch destination', () => {
    const matches = matchRoutes(createConfiguredGlobalRoutes(), '/configured/reports/monthly');

    expect(matches?.map((match) => match.route.id)).toEqual([
      undefined,
      'section:configured:reports',
      'section:configured:reports:monthly',
      'section:configured:reports:monthly:index',
    ]);
  });

  it('keeps every generated segment case-sensitive', () => {
    const matches = matchRoutes(
      createConfiguredGlobalRoutes(),
      '/configured/reports/MONTHLY/record',
    );

    expect(matches).toBeNull();
  });

  it('attaches lazy page loaders to both branch destinations and leaves', () => {
    const reportsLazy: PageRouteLoader = async () => ({ Component: () => null });
    const recordLazy: PageRouteLoader = async () => ({ Component: () => null });
    const routes = buildNavigationItemRoutes(configuredItems, {
      routeIdPrefix: 'section:configured',
      getLazy: (item) => {
        if (item.id === 'reports') return reportsLazy;
        if (item.id === 'record') return recordLazy;
        return undefined;
      },
    });
    const reportsRoute = routes[0];
    const recordRoute = reportsRoute?.children?.[1]?.children?.[1];

    expect(reportsRoute?.children?.[0]?.lazy).toBe(reportsLazy);
    expect(recordRoute?.lazy).toBe(recordLazy);
  });
});
