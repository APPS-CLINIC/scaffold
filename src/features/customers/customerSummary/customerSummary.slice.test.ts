import { describe, expect, it } from 'vitest';
import {
  customerSummaryChanged,
  customerSummaryCleared,
  customerSummaryReducer,
} from './customerSummary.slice';
import type { CustomerSummary } from './customerSummary.types';

const data: CustomerSummary = {
  fullName: 'ACME Corporation Ltd.',
  grid: 'PL12345678',
  corporateGroupName: null,
  corporateGroupGrid: null,
  internalGroupName: null,
  pamLam: null,
  homeCountry: null,
  segmentColor: null,
  rating: null,
  status: 'ACTIVE',
  kkf: null,
  pamName: null,
  lendingRatingDate: null,
  cddRiskLevel: null,
  cddExpirationDate: null,
};

describe('customerSummary mirror slice', () => {
  it('starts empty', () => {
    expect(customerSummaryReducer(undefined, { type: '@@INIT' })).toEqual({
      customerId: null,
      data: null,
      status: 'idle',
    });
  });

  it('clears stale data and records loading before accepting the active response', () => {
    const previous = customerSummaryReducer(
      customerSummaryReducer(
        undefined,
        customerSummaryChanged({ customerId: '41', status: 'loading' }),
      ),
      customerSummaryChanged({ customerId: '41', status: 'succeeded', data }),
    );
    const loading = customerSummaryReducer(
      previous,
      customerSummaryChanged({ customerId: '42', status: 'loading' }),
    );
    const succeeded = customerSummaryReducer(
      loading,
      customerSummaryChanged({ customerId: '42', status: 'succeeded', data }),
    );

    expect(loading).toEqual({ customerId: '42', data: null, status: 'loading' });
    expect(succeeded).toEqual({ customerId: '42', data, status: 'succeeded' });
  });

  it('records a failed request without retaining data', () => {
    const loading = customerSummaryReducer(
      undefined,
      customerSummaryChanged({ customerId: '42', status: 'loading' }),
    );
    expect(
      customerSummaryReducer(
        loading,
        customerSummaryChanged({ customerId: '42', status: 'failed' }),
      ),
    ).toEqual({ customerId: '42', data: null, status: 'failed' });
  });

  it('ignores stale responses and stale cleanup from the previous customer', () => {
    const active = customerSummaryReducer(
      undefined,
      customerSummaryChanged({ customerId: 'new', status: 'loading' }),
    );
    const afterStaleResponse = customerSummaryReducer(
      active,
      customerSummaryChanged({ customerId: 'old', status: 'succeeded', data }),
    );

    expect(afterStaleResponse).toBe(active);
    expect(
      customerSummaryReducer(afterStaleResponse, customerSummaryCleared({ customerId: 'old' })),
    ).toBe(active);
  });

  it('clears only the active customer on layout exit', () => {
    const active = customerSummaryReducer(
      undefined,
      customerSummaryChanged({ customerId: '42', status: 'loading' }),
    );

    expect(customerSummaryReducer(active, customerSummaryCleared({ customerId: '42' }))).toEqual({
      customerId: null,
      data: null,
      status: 'idle',
    });
  });
});
