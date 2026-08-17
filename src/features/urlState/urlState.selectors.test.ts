import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import {
  selectActiveNavigationItemId,
  selectActiveTab,
  selectActiveTabIndex,
  selectPathname,
} from './urlState.selectors';
import { routeChanged } from './urlState.slice';

describe('urlState route selectors', () => {
  it('derives navigation reads from one canonical route object', () => {
    const store = makeStore();
    store.dispatch(
      routeChanged({
        pathname: '/customers/all/123',
        sectionKey: 'customers',
        itemId: 'all-customers',
      }),
    );

    const state = store.getState();
    expect(selectPathname(state)).toBe('/customers/all/123');
    expect(selectActiveTab(state)).toBe('customers');
    expect(selectActiveNavigationItemId(state)).toBe('all-customers');
    expect(selectActiveTabIndex(state)).toBe(2);
  });
});
