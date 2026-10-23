import { describe, expect, it } from 'vitest';
import { defaultListQuery } from '@/features/urlState/urlState.schema';
import { customerListLoadCause } from './customerListLoad';

const shown = { ...defaultListQuery, q: 'orlen', filters: { status: ['ACTIVE'] } };

describe('customerListLoadCause', () => {
  it('is the first load until a list was shown', () => {
    expect(customerListLoadCause(null, shown)).toBe('first');
  });

  it('is the search when only the search changes', () => {
    expect(customerListLoadCause(shown, { ...shown, q: 'orlen sa', page: 1 })).toBe('search');
  });

  it('is the filters when they change, also together with the search', () => {
    expect(customerListLoadCause(shown, { ...shown, filters: { status: ['ARCHIVAL'] } })).toBe(
      'filters',
    );
    expect(customerListLoadCause(shown, { ...shown, q: '', filters: {} })).toBe('filters');
  });

  it('is something else for the page, the sort or the same query again', () => {
    expect(customerListLoadCause(shown, { ...shown, page: 2 })).toBe('other');
    expect(customerListLoadCause(shown, { ...shown, sort: 'fullName', dir: 'desc' })).toBe('other');
    expect(customerListLoadCause(shown, shown)).toBe('other');
  });
});
