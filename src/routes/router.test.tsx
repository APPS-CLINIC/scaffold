import { matchRoutes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FACILITIES_PREVIEW_PATH } from '@/dev/facilities/facilitiesPreview.path';
import { getNavigationContextDefaultItemPath, navigationManifest } from '@/routes/navigation';
import { router } from './router';

describe('application router manifest integration', () => {
  it('derives application section routes from the unified manifest', () => {
    const applicationRoute = router.routes[0];
    const configuredSectionPaths = navigationManifest.sections
      .filter((section) => section.path !== '/')
      .map((section) => section.path);
    const routedSectionPaths = applicationRoute?.children
      ?.filter((route) => route.path !== 'customers/all/dev-facilities/:facilityId?')
      ?.map((route) => route.path)
      .filter((path): path is string => typeof path === 'string');

    expect(routedSectionPaths).toEqual(configuredSectionPaths);
  });

  it('registers the standalone Facilities preview below /customers only in development', async () => {
    for (const path of [FACILITIES_PREVIEW_PATH, FACILITIES_PREVIEW_PATH + '/1006']) {
      expect(matchRoutes(router.routes, path)?.at(-1)?.route.path).toBe(
        'customers/all/dev-facilities/:facilityId?',
      );
    }
    expect(matchRoutes(router.routes, '/customers/42')?.at(-1)?.route.path).not.toBe(
      'customers/all/dev-facilities/:facilityId?',
    );
    expect(matchRoutes(router.routes, '/dev/facilities')?.at(-1)?.route.path).toBe('*');
    expect(navigationManifest.sections.map((section) => section.path)).not.toContain('/dev');

    vi.stubEnv('DEV', false);
    vi.resetModules();
    try {
      const { router: productionRouter } = await import('./router');
      expect(
        matchRoutes(productionRouter.routes, FACILITIES_PREVIEW_PATH + '/1006')?.at(-1)?.route.path,
      ).not.toBe('customers/all/dev-facilities/:facilityId?');
      productionRouter.dispose();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it('places configured static customer destinations before the dynamic detail route', () => {
    const applicationRoute = router.routes[0];
    const customersSection = navigationManifest.sections.find(
      (section) => section.id === 'customers',
    );
    const customerContext = customersSection?.context;
    const customersRoute = applicationRoute?.children?.find(
      (route) => route.path === customersSection?.path,
    );
    const childPaths = customersRoute?.children
      ?.map((route) => route.path)
      .filter((path): path is string => typeof path === 'string');

    expect(childPaths?.slice(0, customersSection?.sidebar.items.length)).toEqual(
      customersSection?.sidebar.items.map((item) => item.segment),
    );
    expect(childPaths?.at(-1)).toBe(`:${customerContext?.parameter}`);
  });

  it('adds the configured context default as the detail route index', () => {
    const customersSection = navigationManifest.sections.find(
      (section) => section.id === 'customers',
    );
    const customerContext = customersSection?.context;
    const customersRoute = router.routes[0]?.children?.find(
      (route) => route.path === customersSection?.path,
    );
    const customerDetailRoute = customersRoute?.children?.find(
      (route) => route.path === `:${customerContext?.parameter}`,
    );

    expect(customerDetailRoute?.children?.[0]?.index).toBe(true);
    expect(customerContext && getNavigationContextDefaultItemPath(customerContext)).toBe(
      'general-data',
    );
  });

  it('rejects non-canonical route casing just like the pathname resolver', () => {
    const matches = matchRoutes(router.routes, '/CUSTOMERS/42/GENERAL-DATA');

    expect(matches?.some((match) => match.route.path === '/customers')).toBe(false);
    expect(matches?.some((match) => match.route.path === ':id')).toBe(false);
    expect(matches?.at(-1)?.route.path).toBe('*');
  });
});
