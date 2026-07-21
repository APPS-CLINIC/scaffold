import { describe, expect, it } from 'vitest';
import { routeChanged, urlStateReducer } from './urlState.slice';

describe('urlState route mirror', () => {
  it('exposes one stable action for every pathname transition', () => {
    const action = routeChanged({
      pathname: '/clients/all/123',
      sectionKey: 'clients',
      itemId: 'all-clients',
    });

    expect(action.type).toBe('urlState/routeChanged');
    expect(urlStateReducer(undefined, action).route).toEqual(action.payload);
  });
});
