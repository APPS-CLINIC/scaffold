import { isValidElement, type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createPaginatorTemplate, mapPageEvent, mapSortEvent } from './GenericDataTable.prime';

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

// The paginator labels are ours, injected into the elements PrimeReact hands the
// template. Exercising the template functions directly covers that mapping without
// depending on whether the surrounding library renders the paginator at all — the
// render test asserts the same labels reach the DOM.
const labels = {
  firstPage: 'First customer page',
  previousPage: 'Previous customer page',
  nextPage: 'Next customer page',
  lastPage: 'Last customer page',
  page: (page: number) => `Customer page ${page}`,
  rowsPerPage: 'Customers per page',
  currentPageReport: (first: number, last: number, total: number) =>
    `Showing ${first}-${last} of ${total}`,
};

describe('createPaginatorTemplate', () => {
  it('returns nothing when no labels are configured', () => {
    expect(createPaginatorTemplate(undefined)).toBeUndefined();
  });

  it('orders the paginator controls', () => {
    expect(createPaginatorTemplate(labels)?.layout).toBe(
      'RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink',
    );
  });

  it.each([
    ['FirstPageLink', 'First customer page'],
    ['PrevPageLink', 'Previous customer page'],
    ['NextPageLink', 'Next customer page'],
    ['LastPageLink', 'Last customer page'],
  ] as const)('labels the %s the vendor supplies', (key, expected) => {
    const template = createPaginatorTemplate(labels);
    const entry = template?.[key];
    if (typeof entry !== 'function') throw new Error(`Expected ${key} to be a template function.`);

    const result = entry({ element: <button type="button" /> } as never);
    if (!isValidElement(result)) throw new Error(`Expected ${key} to return an element.`);

    render(result as ReactElement);
    expect(screen.getByRole('button', { name: expected })).toBeInTheDocument();
  });

  it('numbers page links from one, not from the vendor zero-based index', () => {
    const entry = createPaginatorTemplate(labels)?.PageLinks;
    if (typeof entry !== 'function') throw new Error('Expected PageLinks to be a function.');

    render(entry({ element: <button type="button" />, page: 0 } as never) as ReactElement);
    expect(screen.getByRole('button', { name: 'Customer page 1' })).toBeInTheDocument();
  });

  it('renders the current page report from the vendor counts', () => {
    const entry = createPaginatorTemplate(labels)?.CurrentPageReport;
    if (typeof entry !== 'function')
      throw new Error('Expected CurrentPageReport to be a function.');

    render(entry({ first: 1, last: 10, totalRecords: 22 } as never) as ReactElement);
    expect(screen.getByText('Showing 1-10 of 22')).toBeInTheDocument();
  });
});
