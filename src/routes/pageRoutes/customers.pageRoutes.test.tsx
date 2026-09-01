import { isValidElement } from 'react';
import { render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  matchRoutes,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { getNavigationContextDefaultItemPath, navigationManifest } from '@/routes/navigation';
import { customersDetailRoutes } from './customers.pageRoutes';

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
  it('derives every recursive customer route from the unified manifest context', () => {
    const customerRoute = customersDetailRoutes[0];
    const configuredPaths = customerDetailNavigationContext.sidebar.items.map(
      (item) => item.segment,
    );

    expect(
      customerRoute?.children
        ?.map((route) => route.path)
        .filter((path): path is string => typeof path === 'string' && path !== '*'),
    ).toEqual(configuredPaths);

    const reviewsItem = customerDetailNavigationContext.sidebar.items.find(
      (item) => item.id === 'reviews',
    );
    const reviewsRoute = customerRoute?.children?.find((route) => route.path === 'reviews');
    const reviewChildren =
      reviewsRoute && 'children' in reviewsRoute ? reviewsRoute.children : undefined;

    expect(reviewChildren?.slice(1).map((route) => route.path)).toEqual(
      reviewsItem?.children?.map((item) => item.segment),
    );
  });

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
      'reviews',
      'details',
    ]);
  });

  it('renders only the L3 placeholder at a configured child route', () => {
    const customerRoute = customersDetailRoutes[0];
    const reviewsRoute = customerRoute?.children?.find((route) => route.path === 'reviews');
    if (!reviewsRoute) throw new Error('Expected the reviews customer route');

    const router = createMemoryRouter([reviewsRoute], {
      initialEntries: ['/reviews/details'],
    });

    render(<RouterProvider router={router} />);

    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: i18n.t('nav.customerDetail.reviewDetails') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: i18n.t('nav.customerDetail.reviews') }),
    ).toBeNull();
  });

  it('keeps an unconfigured L3+ deep link inside the customer layout', () => {
    const matches = matchRoutes(
      createCustomerTestRoutes(),
      '/customers/42/general-data/future-section/record-7',
    );

    expect(matches?.map((match) => match.route.path)).toEqual([
      '/customers',
      `:${customerDetailNavigationContext.parameter}`,
      '*',
    ]);
  });
});
