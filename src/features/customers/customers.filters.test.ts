import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { createTableSettingsState } from '@/features/tableSettings';
import { listQueryChanged } from '@/features/urlState/urlState.slice';
import { defaultListQuery } from '@/features/urlState/urlState.schema';
import { parseCustomerFilters, selectCustomerQuery } from './customers.filters';

describe('customer URL filters', () => {
  it('keeps only the values the endpoint accepts', () => {
    expect(
      parseCustomerFilters({
        status: ['ACTIVE', 'active', 'UNKNOWN'],
        type: ['CORPORATE', 'Corporate'],
        tsPriceConditionStatus: ['NO_CONTRACT_END_DATE', '1'],
        rmAdvisor: ['rm-1', 'not an id'],
        internalGroupId: ['NONE', '17'],
        'lendingReviewDate.from': ['2026-02-01'],
        'lendingReviewDate.to': ['2026-03-31'],
        lendingRating: ['  BBB  '],
        owner: ['mine'],
      }),
    ).toMatchObject({
      status: ['ACTIVE'],
      type: ['CORPORATE'],
      tsPriceConditionStatus: ['NO_CONTRACT_END_DATE'],
      rmAdvisor: ['rm-1'],
      internalGroupId: ['NONE', '17'],
      'lendingReviewDate.from': ['2026-02-01'],
      'lendingReviewDate.to': ['2026-03-31'],
      lendingRating: ['BBB'],
    });
  });

  it('keeps one valid day per end and drops a reversed range, but keeps a one-day range', () => {
    expect(
      parseCustomerFilters({
        'lendingReviewDate.from': ['2026-02-31'],
        'lendingReviewDate.to': ['2026-03-01', '2026-03-02'],
        'lendingRatingReviewDate.from': ['2026-03-31'],
        'lendingRatingReviewDate.to': ['2026-02-01'],
        'tsPriceConditionEndDate.from': ['2026-03-31'],
        'tsPriceConditionEndDate.to': ['2026-03-31'],
      }),
    ).toMatchObject({
      'lendingReviewDate.from': [],
      'lendingReviewDate.to': ['2026-03-01'],
      'lendingRatingReviewDate.from': [],
      'lendingRatingReviewDate.to': [],
      'tsPriceConditionEndDate.from': ['2026-03-31'],
      'tsPriceConditionEndDate.to': ['2026-03-31'],
    });
  });

  it('has no filter for an absent param and never passes unknown params on', () => {
    const filters = parseCustomerFilters({ owner: ['mine'] });

    expect(filters).not.toHaveProperty('owner');
    expect(filters.status).toEqual([]);
    expect(filters['lendingReviewDate.from']).toEqual([]);
    expect(filters.lendingRating).toEqual([]);
  });

  it('derives endpoint arguments from the Redux URL mirror', () => {
    const store = makeStore();
    store.dispatch(
      listQueryChanged({
        ...defaultListQuery,
        q: 'bank',
        filters: { status: ['ARCHIVAL'], type: ['CORPORATE'], internalGroupId: ['17'] },
        page: 2,
      }),
    );

    const query = selectCustomerQuery(store.getState());

    expect(query).toMatchObject({ q: 'bank', page: 2 });
    expect(query.filters).toMatchObject({
      status: ['ARCHIVAL'],
      type: ['CORPORATE'],
      internalGroupId: ['17'],
    });
  });

  it('ignores the filter of a field the user removed from the table', () => {
    const store = makeStore({
      tableSettings: createTableSettingsState({
        version: 1,
        tables: { customers: { columns: ['fullName', 'type'] } },
      }),
    });
    store.dispatch(
      listQueryChanged({
        ...defaultListQuery,
        filters: { status: ['ARCHIVAL'], type: ['CORPORATE'] },
      }),
    );

    const { filters } = selectCustomerQuery(store.getState());

    expect(filters.status).toEqual([]);
    expect(filters.type).toEqual(['CORPORATE']);
  });
});
