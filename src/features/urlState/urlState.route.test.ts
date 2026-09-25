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

  it('keeps an unsupported exact-item descendant observable without claiming a sidebar item', () => {
    expect(parseUrlRouteState('/customers/all/123/documents')).toEqual({
      pathname: '/customers/all/123/documents',
      sectionKey: 'customers',
      itemId: null,
    });
  });

  it('mirrors the active customer L2 owner for L2 and L3+ paths', () => {
    expect(parseUrlRouteState('/customers/42/general-data')).toEqual({
      pathname: '/customers/42/general-data',
      sectionKey: 'customers',
      itemId: 'general-data',
    });
    expect(parseUrlRouteState('/customers/42/reviews/record-7')).toEqual({
      pathname: '/customers/42/reviews/record-7',
      sectionKey: 'customers',
      itemId: 'reviews',
    });
  });

  it('keeps the customer L1 route distinct from every L2 tab', () => {
    expect(parseUrlRouteState('/customers/42')).toEqual({
      pathname: '/customers/42',
      sectionKey: 'customers',
      itemId: null,
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
