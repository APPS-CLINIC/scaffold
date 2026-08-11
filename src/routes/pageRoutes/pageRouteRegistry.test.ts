import { describe, expect, it } from 'vitest';
import { getPageRouteLoader } from './pageRouteRegistry';

describe('page route registry', () => {
  it('resolves a lazy page module by stable navigation identity', async () => {
    const loader = getPageRouteLoader('customers', 'all-customers');

    expect(loader).toBeTypeOf('function');
    if (!loader) throw new Error('Expected the customers page route to be registered');

    const [{ CustomersPage }, routeModule] = await Promise.all([
      import('@/routes/pages/customers/CustomersPage'),
      loader(),
    ]);

    expect(routeModule.Component).toBe(CustomersPage);
  });

  it('leaves unimplemented destinations to the placeholder fallback', () => {
    expect(getPageRouteLoader('customers', 'unknown-item')).toBeUndefined();
    expect(getPageRouteLoader('portfolio', 'clients')).toBeUndefined();
  });
});
