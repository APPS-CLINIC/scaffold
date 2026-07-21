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
        pathname: '/clients/all/123',
        sectionKey: 'clients',
        itemId: 'all-clients',
      }),
    );

    const state = store.getState();
    expect(selectPathname(state)).toBe('/clients/all/123');
    expect(selectActiveTab(state)).toBe('clients');
    expect(selectActiveNavigationItemId(state)).toBe('all-clients');
    expect(selectActiveTabIndex(state)).toBe(2);
  });
});
