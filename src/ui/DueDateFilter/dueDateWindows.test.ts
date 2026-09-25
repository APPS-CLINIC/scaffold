import { describe, expect, it } from 'vitest';
import { dueDateWindow, filterByDueDate, type DueDateFilterValue } from './dueDateWindows';

const today = new Date('2026-09-25T12:00:00');

describe('dueDateWindow', () => {
  it.each([
    ['2026-05-28', 'overdue'],
    ['2026-09-24', 'overdue'],
    ['2026-09-25', 'upTo30Days'],
    ['2026-10-25', 'upTo30Days'],
    ['2026-10-26', 'over30Days'],
    ['2027-03-31', 'over30Days'],
  ] as const)('puts %s into %s', (value, window) => {
    expect(dueDateWindow(value, today)).toBe(window);
  });

  it.each([null, '', 'unknown', '2026-02-31', '2026-09-24T10:00:00Z'])(
    'gives %s no window',
    (value) => {
      expect(dueDateWindow(value, today)).toBeNull();
    },
  );
});

describe('filterByDueDate', () => {
  const items = [
    { id: 'overdue', date: '2026-09-01' },
    { id: 'soon', date: '2026-10-01' },
    { id: 'later', date: '2026-12-01' },
    { id: 'undated', date: null },
  ];
  const ids = (filter: DueDateFilterValue) =>
    filterByDueDate(items, (item) => item.date, filter, today).map((item) => item.id);

  it('keeps every item, dated or not, for all', () => {
    expect(ids('all')).toEqual(['overdue', 'soon', 'later', 'undated']);
  });

  it('keeps only the items whose date falls into the chosen window', () => {
    expect(ids('overdue')).toEqual(['overdue']);
    expect(ids('upTo30Days')).toEqual(['soon']);
    expect(ids('over30Days')).toEqual(['later']);
  });

  it('returns a new array and leaves the input alone', () => {
    const result = filterByDueDate(items, (item) => item.date, 'all', today);

    expect(result).not.toBe(items);
    expect(items).toHaveLength(4);
  });
});
