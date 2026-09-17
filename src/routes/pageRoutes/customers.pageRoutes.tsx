import { Navigate, type RouteObject } from 'react-router-dom';
import type { MessageKey } from '@/i18n/messages/pl';
import { SectionPage } from '@/routes/pages/SectionPage';
import { CustomerDetailFallbackPage } from '@/routes/pages/customers/CustomerDetailFallbackPage';
import type { SectionPageRoutes } from './pageRoutes.types';

/** Route-level code-split points for the customers navigation section. */
export const customersPageRoutes = {
  'all-customers': async () => {
    const { CustomersPage } = await import('@/routes/pages/customers/CustomersPage');

    return { Component: CustomersPage };
  },
} satisfies SectionPageRoutes<'customers'>;

const placeholder = (titleKey: MessageKey) => <SectionPage titleKey={titleKey} headingLevel={2} />;

/**
 * Routes below `/customers/:id`. Static segments must equal the manifest's customer-context
 * segments: the sidebar, breadcrumb and URL mirror derive their state from the pathname alone.
 * `customers.pageRoutes.test.tsx` guards that equality.
 */
export const customersDetailRoutes: readonly RouteObject[] = [
  {
    path: ':id',
    caseSensitive: true,
    lazy: async () => {
      const { CustomerDetailLayout } =
        await import('@/routes/pages/customers/CustomerDetailLayout');

      return { Component: CustomerDetailLayout };
    },
    children: [
      { index: true, element: <Navigate to="general-data" replace /> },
      // Dashboard and its future descendants render without the summary panel.
      // A lone `dashboard/*` also matches bare `/dashboard`.
      {
        path: 'dashboard/*',
        caseSensitive: true,
        element: <div className="mt-6">{placeholder('nav.customerDetail.dashboard')}</div>,
      },
      {
        // Pathless layout: the persistent summary panel above every other tab.
        lazy: async () => {
          const { CustomerSummaryLayout } =
            await import('@/routes/pages/customers/CustomerSummaryLayout');

          return { Component: CustomerSummaryLayout };
        },
        children: [
          {
            path: 'general-data',
            caseSensitive: true,
            lazy: async () => {
              const { CustomerGeneralDataPage } =
                await import('@/routes/pages/customers/CustomerGeneralDataPage');

              return { Component: CustomerGeneralDataPage };
            },
          },
          {
            path: 'cdd-crs-fatca',
            caseSensitive: true,
            lazy: async () => {
              const { CustomerCddCrsFatcaPage } =
                await import('@/routes/pages/customers/CustomerCddCrsFatcaPage');

              return { Component: CustomerCddCrsFatcaPage };
            },
          },
          {
            // One splat route: the part menu inside the page owns the last segment, so
            // the parts stay out of the manifest sidebar tree.
            path: 'fm-data/*',
            caseSensitive: true,
            lazy: async () => {
              const { CustomerFmDataPage } =
                await import('@/routes/pages/customers/CustomerFmDataPage');

              return { Component: CustomerFmDataPage };
            },
          },
          {
            path: 'reviews',
            caseSensitive: true,
            children: [
              { index: true, element: placeholder('nav.customerDetail.reviews') },
              {
                path: 'details',
                caseSensitive: true,
                element: placeholder('nav.customerDetail.reviewDetails'),
              },
            ],
          },
          {
            path: 'monitoring',
            caseSensitive: true,
            element: placeholder('nav.customerDetail.monitoring'),
          },
          {
            path: 'limits',
            caseSensitive: true,
            element: placeholder('nav.customerDetail.limits'),
          },
          {
            path: 'products',
            caseSensitive: true,
            element: placeholder('nav.customerDetail.products'),
          },
          // Unknown deep links stay inside the customer layout.
          { path: '*', element: <CustomerDetailFallbackPage /> },
        ],
      },
    ],
  },
];
