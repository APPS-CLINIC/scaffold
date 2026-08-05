import type { SectionPageRoutes } from './pageRoutes.types';

/** Route-level code-split points for the clients navigation section. */
export const clientsPageRoutes = {
  'all-clients': async () => {
    const { CustomersPage } = await import('@/routes/pages/clients/CustomersPage');

    return { Component: CustomersPage };
  },
} satisfies SectionPageRoutes<'clients'>;
