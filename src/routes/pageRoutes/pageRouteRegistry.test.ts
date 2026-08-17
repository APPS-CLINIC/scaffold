import { describe, expect, it } from 'vitest';
import { getPageRouteLoader } from './pageRouteRegistry';

describe('page route registry', () => {
  // The lazy page import compiles the whole CustomersPage graph on first
  // load; on cold/slow machines that can exceed the default 5s timeout.
  it('resolves a lazy page module by stable navigation identity', { timeout: 15_000 }, async () => {
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
