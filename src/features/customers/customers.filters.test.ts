import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { listQueryChanged } from '@/features/urlState/urlState.slice';
import { defaultListQuery } from '@/features/urlState/urlState.schema';
import {
  parseCustomerFilters,
  selectCustomerQuery,
  updateCustomerUrlFilters,
} from './customers.filters';

describe('customer URL filters', () => {
  it('validates feature values without leaking them into the generic URL schema', () => {
    expect(parseCustomerFilters({ status: 'unsupported', type: 'Corporate' })).toEqual({
      status: '',
      type: 'Corporate',
    });
  });

  it('updates customer keys and preserves unrelated generic filters', () => {
    expect(
      updateCustomerUrlFilters(
        { owner: 'mine', status: 'active', type: 'Corporate' },
        { status: '', type: 'Institutional' },
      ),
    ).toEqual({ owner: 'mine', type: 'Institutional' });
  });

  it('derives endpoint arguments from the Redux URL mirror', () => {
    const store = makeStore();
    store.dispatch(
      listQueryChanged({
        ...defaultListQuery,
        q: 'bank',
        filters: { status: 'archival', type: 'Corporate' },
        page: 2,
      }),
    );

    expect(selectCustomerQuery(store.getState())).toMatchObject({
      q: 'bank',
      status: 'archival',
      type: 'Corporate',
      page: 2,
    });
  });
});
