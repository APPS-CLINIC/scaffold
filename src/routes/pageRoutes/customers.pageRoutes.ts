import type { SectionPageRoutes } from './pageRoutes.types';

/** Route-level code-split points for the customers navigation section. */
export const customersPageRoutes = {
  'all-customers': async () => {
    const { CustomersPage } = await import('@/routes/pages/customers/CustomersPage');

    return { Component: CustomersPage };
  },
} satisfies SectionPageRoutes<'customers'>;
