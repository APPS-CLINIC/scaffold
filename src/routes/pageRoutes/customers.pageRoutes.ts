import type { SectionDetailRoutes, SectionPageRoutes } from './pageRoutes.types';

/** Route-level code-split points for the customers navigation section. */
export const customersPageRoutes = {
  'all-customers': async () => {
    const { CustomersPage } = await import('@/routes/pages/customers/CustomersPage');

    return { Component: CustomersPage };
  },
} satisfies SectionPageRoutes<'customers'>;

/**
 * Customer routes that are not navigation destinations. Paths are relative
 * to the section path, matching how React Router nests them.
 */
export const customersDetailRoutes = [
  {
    path: ':id',
    lazy: async () => {
      const { CustomerDetailsPage } = await import('@/routes/pages/customers/CustomerDetailsPage');

      return { Component: CustomerDetailsPage };
    },
  },
] satisfies SectionDetailRoutes;
