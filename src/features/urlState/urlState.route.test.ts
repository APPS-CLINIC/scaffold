import { describe, expect, it } from 'vitest';
import { parseUrlRouteState } from './urlState.route';

describe('parseUrlRouteState', () => {
  it('identifies the active section and contextual item', () => {
    expect(parseUrlRouteState('/customers/all')).toEqual({
      pathname: '/customers/all',
      sectionKey: 'customers',
      itemId: 'all-customers',
    });
    expect(parseUrlRouteState('/portfolio/reviews')).toEqual({
      pathname: '/portfolio/reviews',
      sectionKey: 'portfolio',
      itemId: 'reviews',
    });
  });

  it('retains the full pathname for deeper content under the same sidebar item', () => {
    expect(parseUrlRouteState('/customers/all/123/documents')).toEqual({
      pathname: '/customers/all/123/documents',
      sectionKey: 'customers',
      itemId: 'all-customers',
    });
  });

  it('resolves the shared fallback item for an empty section root', () => {
    expect(parseUrlRouteState('/groups')).toEqual({
      pathname: '/groups',
      sectionKey: 'groups',
      itemId: 'overview',
    });
  });

  it('keeps unknown paths observable without inventing a sidebar item', () => {
    expect(parseUrlRouteState('/unknown')).toEqual({
      pathname: '/unknown',
      sectionKey: 'home',
      itemId: null,
    });
  });
});
