import { Navigate } from 'react-router-dom';
import { buildNavigationItemRoutes } from '@/routes/buildNavigationItemRoutes';
import { getNavigationContextDefaultItemPath, navigationManifest } from '@/routes/navigation';
import type { NavigationTreeItemConfig } from '@/routes/navigation';
import { CustomerDetailFallbackPage } from '@/routes/pages/customers/CustomerDetailFallbackPage';
import type {
  SectionContextPageRoutes,
  SectionDetailRoutes,
  SectionPageRoutes,
} from './pageRoutes.types';

/** Route-level code-split points for the customers navigation section. */
export const customersPageRoutes = {
  'all-customers': async () => {
    const { CustomersPage } = await import('@/routes/pages/customers/CustomersPage');

    return { Component: CustomersPage };
  },
} satisfies SectionPageRoutes<'customers'>;

/** Route-level code-split points for every customer-context navigation destination. */
export const customerDetailPageRoutes = {
  dashboard: async () => {
    const { CustomerDashboardPage } =
      await import('@/routes/pages/customers/CustomerDashboardPage');

    return { Component: CustomerDashboardPage };
  },
  'general-data': async () => {
    const { CustomerGeneralDataPage } =
      await import('@/routes/pages/customers/CustomerGeneralDataPage');

    return { Component: CustomerGeneralDataPage };
  },
  'cdd-crs-fatca': async () => {
    const { CustomerCddCrsFatcaPage } =
      await import('@/routes/pages/customers/CustomerCddCrsFatcaPage');

    return { Component: CustomerCddCrsFatcaPage };
  },
  reviews: async () => {
    const { CustomerReviewsPage } = await import('@/routes/pages/customers/CustomerReviewsPage');

    return { Component: CustomerReviewsPage };
  },
  'review-details': async () => {
    const { CustomerReviewDetailsPage } =
      await import('@/routes/pages/customers/CustomerReviewDetailsPage');

    return { Component: CustomerReviewDetailsPage };
  },
  monitoring: async () => {
    const { CustomerMonitoringPage } =
      await import('@/routes/pages/customers/CustomerMonitoringPage');

    return { Component: CustomerMonitoringPage };
  },
  limits: async () => {
    const { CustomerLimitsPage } = await import('@/routes/pages/customers/CustomerLimitsPage');

    return { Component: CustomerLimitsPage };
  },
  products: async () => {
    const { CustomerProductsPage } = await import('@/routes/pages/customers/CustomerProductsPage');

    return { Component: CustomerProductsPage };
  },
} satisfies SectionContextPageRoutes<'customers'>;

function hasCustomerDetailPageRoute(
  item: NavigationTreeItemConfig,
): item is NavigationTreeItemConfig & { id: keyof typeof customerDetailPageRoutes } {
  return Object.hasOwn(customerDetailPageRoutes, item.id);
}

const customerDetailNavigationContext = navigationManifest.sections.find(
  (section) => section.id === 'customers',
)?.context;

if (!customerDetailNavigationContext) {
  throw new Error('The navigation manifest must declare the customer-detail context.');
}

const customerDetailDefaultItemPath = getNavigationContextDefaultItemPath(
  customerDetailNavigationContext,
);
const customerDashboardItem = customerDetailNavigationContext.sidebar.items.find(
  (item) => item.id === 'dashboard',
);

if (!customerDashboardItem) {
  throw new Error('The customer-detail context must declare the dashboard destination.');
}

const customerSummaryNavigationItems = customerDetailNavigationContext.sidebar.items.filter(
  (item) => item.id !== customerDashboardItem.id,
);

/**
 * Customer routes that are not navigation destinations. Paths are relative
 * to the section path, matching how React Router nests them. `:id` is a
 * layout route: `CustomerDetailLayout` mounts summary synchronization and the
 * page heading once while its nested tab pages swap under `<Outlet/>`.
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
      ...buildNavigationItemRoutes([customerDashboardItem], {
        routeIdPrefix: `context:customers:${customerDetailNavigationContext.id}`,
        getLazy: (item) =>
          hasCustomerDetailPageRoute(item) ? customerDetailPageRoutes[item.id] : undefined,
        placeholderHeadingLevel: 2,
      }),
      // Dashboard descendants retain dashboard-owned chrome. This explicit
      // static branch outranks the generic customer-context fallback below.
      {
        path: `${customerDashboardItem.segment}/*`,
        lazy: customerDetailPageRoutes.dashboard,
      },
      {
        id: `context:customers:${customerDetailNavigationContext.id}:summary-layout`,
        lazy: async () => {
          const { CustomerSummaryLayout } =
            await import('@/routes/pages/customers/CustomerSummaryLayout');

          return { Component: CustomerSummaryLayout };
        },
        children: [
          ...buildNavigationItemRoutes(customerSummaryNavigationItems, {
            routeIdPrefix: `context:customers:${customerDetailNavigationContext.id}`,
            getLazy: (item) =>
              hasCustomerDetailPageRoute(item) ? customerDetailPageRoutes[item.id] : undefined,
            placeholderHeadingLevel: 2,
          }),
          // Keep future/unconfigured L2+ deep links inside the customer layout.
          // Prefix matching still identifies a configured L2 owner where one
          // exists, and the resolver preserves every unmatched segment.
          { path: '*', element: <CustomerDetailFallbackPage /> },
        ],
      },
    ],
  },
] satisfies SectionDetailRoutes;
