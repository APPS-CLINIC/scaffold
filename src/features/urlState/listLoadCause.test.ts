import { describe, expect, it } from 'vitest';
import { defaultListQuery } from './urlState.schema';
import { listLoadCause } from './listLoadCause';

const shown = { ...defaultListQuery, q: 'orlen', filters: { status: ['ACTIVE'] } };

describe('listLoadCause', () => {
  it('is the first load until a list was shown', () => {
    expect(listLoadCause(null, shown)).toBe('first');
  });

  it('is the search when only the search changes', () => {
    expect(listLoadCause(shown, { ...shown, q: 'orlen sa', page: 1 })).toBe('search');
  });

  it('is the filters when they change, also together with the search', () => {
    expect(listLoadCause(shown, { ...shown, filters: { status: ['ARCHIVAL'] } })).toBe('filters');
    expect(listLoadCause(shown, { ...shown, q: '', filters: {} })).toBe('filters');
  });

  it('is something else for the page, the sort or the same query again', () => {
    expect(listLoadCause(shown, { ...shown, page: 2 })).toBe('other');
    expect(listLoadCause(shown, { ...shown, sort: 'fullName', dir: 'desc' })).toBe('other');
    expect(listLoadCause(shown, shown)).toBe('other');
  });
});
