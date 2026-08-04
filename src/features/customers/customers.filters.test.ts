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
    expect(parseCustomerFilters({ status: 'unsupported', sector: 'Energy' })).toEqual({
      status: '',
      sector: 'Energy',
    });
  });

  it('updates customer keys and preserves unrelated generic filters', () => {
    expect(
      updateCustomerUrlFilters(
        { owner: 'mine', status: 'active', sector: 'Energy' },
        { status: '', sector: 'Technology' },
      ),
    ).toEqual({ owner: 'mine', sector: 'Technology' });
  });

  it('derives endpoint arguments from the Redux URL mirror', () => {
    const store = makeStore();
    store.dispatch(
      listQueryChanged({
        ...defaultListQuery,
        q: 'bank',
        filters: { status: 'inactive', sector: 'Manufacturing' },
        page: 2,
      }),
    );

    expect(selectCustomerQuery(store.getState())).toMatchObject({
      q: 'bank',
      status: 'inactive',
      sector: 'Manufacturing',
      page: 2,
    });
  });
});
