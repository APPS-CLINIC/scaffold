import { describe, expect, it } from 'vitest';
import { createUrlState, routeChanged, urlStateReducer } from './urlState.slice';

describe('urlState route mirror', () => {
  it('exposes one stable action for every pathname transition', () => {
    const action = routeChanged({
      pathname: '/customers/all/123',
      sectionKey: 'customers',
      itemId: 'all-customers',
    });

    expect(action.type).toBe('urlState/routeChanged');
    expect(urlStateReducer(undefined, action).route).toEqual(action.payload);
  });

  it('creates the initial Redux mirror from the browser URL', () => {
    expect(
      createUrlState(
        '/customers/all',
        '?q=bank&filter.status=active&filter.sector=Corporate&page=3&pageSize=10',
      ),
    ).toMatchObject({
      list: {
        q: 'bank',
        filters: { status: 'active', sector: 'Corporate' },
        page: 3,
        pageSize: 10,
      },
      route: {
        pathname: '/customers/all',
        sectionKey: 'customers',
        itemId: 'all-customers',
      },
    });
  });
});
