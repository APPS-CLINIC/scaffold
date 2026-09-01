import { Navigate } from 'react-router-dom';
import { buildNavigationItemRoutes } from '@/routes/buildNavigationItemRoutes';
import { getNavigationContextDefaultItemPath, navigationManifest } from '@/routes/navigation';
import { CustomerDetailFallbackPage } from '@/routes/pages/customers/CustomerDetailFallbackPage';
import type { SectionDetailRoutes, SectionPageRoutes } from './pageRoutes.types';

/** Route-level code-split points for the customers navigation section. */
export const customersPageRoutes = {
  'all-customers': async () => {
    const { CustomersPage } = await import('@/routes/pages/customers/CustomersPage');

    return { Component: CustomersPage };
  },
} satisfies SectionPageRoutes<'customers'>;

const customerDetailNavigationContext = navigationManifest.sections.find(
  (section) => section.id === 'customers',
)?.context;

if (!customerDetailNavigationContext) {
  throw new Error('The navigation manifest must declare the customer-detail context.');
}

const customerDetailDefaultItemPath = getNavigationContextDefaultItemPath(
  customerDetailNavigationContext,
);

/**
 * Customer routes that are not navigation destinations. Paths are relative
 * to the section path, matching how React Router nests them. `:id` is a
 * layout route: `CustomerDetailLayout` mounts the summary panel/breadcrumb
 * once and stays mounted while its nested tab children swap under `<Outlet/>`.
 */
export const customersDetailRoutes = [
  {
    path: `:${customerDetailNavigationContext.parameter}`,
    lazy: async () => {
      const { CustomerDetailLayout } =
        await import('@/routes/pages/customers/CustomerDetailLayout');

      return { Component: CustomerDetailLayout };
    },
    children: [
      ...(customerDetailDefaultItemPath
        ? [
            {
              index: true as const,
              element: <Navigate to={customerDetailDefaultItemPath} replace />,
            },
          ]
        : []),
      ...buildNavigationItemRoutes(customerDetailNavigationContext.sidebar.items, {
        routeIdPrefix: `context:customers:${customerDetailNavigationContext.id}`,
        placeholderHeadingLevel: 2,
      }),
      // Keep future/unconfigured L2+ deep links inside the customer layout.
      // Prefix matching still identifies a configured L2 owner where one
      // exists, and the breadcrumb preserves every unmatched segment.
      { path: '*', element: <CustomerDetailFallbackPage /> },
    ],
  },
] satisfies SectionDetailRoutes;
