import { describe, expect, it, vi } from 'vitest';
import { mapPageEvent, mapSortEvent } from './GenericDataTable.prime';

// The module under test pulls twMerge through the `@/ui` barrel, which re-exports the
// IWA package. Faking the package keeps these pure mappers testable on their own.
vi.mock('iwa-react-components', () => import('@/test/iwaComponentsMock'));

// The PrimeReact event shapes are the vendor's; the translation into this repo's
// page/sort contract is ours, and it is pure. Testing it here keeps the mapping
// covered without rendering the table.
describe('mapPageEvent', () => {
  it('turns a zero-based row offset into a one-based page number', () => {
    expect(mapPageEvent({ first: 0, rows: 10 })).toEqual({ page: 1, pageSize: 10 });
    expect(mapPageEvent({ first: 10, rows: 10 })).toEqual({ page: 2, pageSize: 10 });
    expect(mapPageEvent({ first: 50, rows: 25 })).toEqual({ page: 3, pageSize: 25 });
  });

  it('never returns a page or size below one', () => {
    expect(mapPageEvent({ first: -20, rows: 0 })).toEqual({ page: 1, pageSize: 1 });
  });
});

describe('mapSortEvent', () => {
  it('maps the numeric sort order to a direction', () => {
    expect(mapSortEvent({ sortField: 'displayName', sortOrder: 1 })).toEqual({
      field: 'displayName',
      order: 'asc',
    });
    expect(mapSortEvent({ sortField: 'displayName', sortOrder: -1 })).toEqual({
      field: 'displayName',
      order: 'desc',
    });
  });

  it('treats every other order as no sort at all', () => {
    expect(mapSortEvent({ sortField: 'displayName', sortOrder: 0 })).toBeUndefined();
    expect(mapSortEvent({ sortField: 'displayName', sortOrder: null })).toBeUndefined();
    expect(mapSortEvent({ sortField: 'displayName', sortOrder: undefined })).toBeUndefined();
  });
});
