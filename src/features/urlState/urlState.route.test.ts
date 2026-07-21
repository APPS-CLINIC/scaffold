import { describe, expect, it } from 'vitest';
import { parseUrlRouteState } from './urlState.route';

describe('parseUrlRouteState', () => {
  it('identifies the active section and contextual item', () => {
    expect(parseUrlRouteState('/clients/all')).toEqual({
      pathname: '/clients/all',
      sectionKey: 'clients',
      itemId: 'all-clients',
    });
    expect(parseUrlRouteState('/clients/advisors')).toEqual({
      pathname: '/clients/advisors',
      sectionKey: 'clients',
      itemId: 'client-advisors',
    });
  });

  it('retains the full pathname for deeper content under the same sidebar item', () => {
    expect(parseUrlRouteState('/clients/all/123/documents')).toEqual({
      pathname: '/clients/all/123/documents',
      sectionKey: 'clients',
      itemId: 'all-clients',
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
