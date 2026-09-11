import { matchRoutes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getNavigationContextDefaultItemPath, navigationManifest } from '@/routes/navigation';
import { router } from './router';

describe('application router manifest integration', () => {
  it('derives application section routes from the unified manifest', () => {
    const applicationRoute = router.routes[0];
    const configuredSectionPaths = navigationManifest.sections
      .filter((section) => section.path !== '/')
      .map((section) => section.path);
    const routedSectionPaths = applicationRoute?.children
      ?.map((route) => route.path)
      .filter((path): path is string => typeof path === 'string');

    expect(routedSectionPaths).toEqual(configuredSectionPaths);
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
