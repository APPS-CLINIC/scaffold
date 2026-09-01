import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { selectCustomerSummary, selectCustomerSummaryStatus } from './customerSummary.selectors';
import { customerSummaryChanged } from './customerSummary.slice';
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

describe('customer summary selectors', () => {
  it('exposes data and status only for the requested customer identity', () => {
    const store = makeStore();
    store.dispatch(customerSummaryChanged({ customerId: '42', status: 'loading' }));
    store.dispatch(customerSummaryChanged({ customerId: '42', status: 'succeeded', data }));

    expect(selectCustomerSummary(store.getState(), '42')).toEqual(data);
    expect(selectCustomerSummaryStatus(store.getState(), '42')).toBe('succeeded');
    expect(selectCustomerSummary(store.getState(), '43')).toBeNull();
    expect(selectCustomerSummaryStatus(store.getState(), '43')).toBe('loading');
  });
});
