import { describe, expect, it } from 'vitest';
import {
  DATE_DMY_FORMAT_OPTIONS,
  daysPastIsoDate,
  formatIsoDmyDate,
  isPastIsoDate,
} from './dateFormats';

describe('formatIsoDmyDate', () => {
  it.each(['pl', 'en'])('formats a valid ISO local date for %s', (locale) => {
    const expected = new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(
      new Date('2026-08-31T12:00:00'),
    );

    expect(formatIsoDmyDate('2026-08-31', locale)).toBe(expected);
    expect(formatIsoDmyDate('2026-08-31T00:00:00Z', locale)).toBe(expected);
  });

  it.each(['invalid', '2026-02-31', '2026-13-01'])('preserves invalid input %s', (value) => {
    expect(formatIsoDmyDate(value, 'pl')).toBe(value);
  });
});

describe('daysPastIsoDate', () => {
  const today = new Date('2026-09-02T12:00:00');

  it('counts whole calendar days from the value up to today', () => {
    expect(daysPastIsoDate('2026-09-02', today)).toBe(0);
    expect(daysPastIsoDate('2026-09-01', today)).toBe(1);
    expect(daysPastIsoDate('2026-09-05', today)).toBe(-3);
  });

  it('counts through February of a non-leap year', () => {
    expect(daysPastIsoDate('2026-01-31', new Date('2026-03-01T12:00:00'))).toBe(29);
  });

  it('reads the calendar day off the text, so a time suffix cannot move it', () => {
    expect(daysPastIsoDate('2026-09-01T23:59:59Z', today)).toBe(1);
    expect(daysPastIsoDate('2026-09-02T00:00:00Z', today)).toBe(0);
    expect(daysPastIsoDate('2026-09-02T23:59:59Z', today)).toBe(0);
  });

  it.each(['2026-09-02T00:00:00', '2026-09-02T23:59:59.999'])(
    'ignores the time of day of today %s',
    (todayText) => {
      expect(daysPastIsoDate('2026-09-01', new Date(todayText))).toBe(1);
    },
  );

  // Europe/Warsaw switches to DST on 2026-03-29 and back on 2026-10-25, so local
  // midnights on these spans are 23 or 25 hours apart.
  it.each([
    ['2026-03-29', '2026-03-30', 1],
    ['2026-03-26', '2026-04-02', 7],
    ['2026-10-25', '2026-10-26', 1],
    ['2026-10-22', '2026-10-29', 7],
  ])('counts %s → %s as %i whole days across a DST switch', (value, todayText, days) => {
    expect(daysPastIsoDate(value, new Date(`${todayText}T12:00:00`))).toBe(days);
  });

  it('steps exactly one day between consecutive dates all year, whatever the local DST rules', () => {
    const mismatches: string[] = [];

    for (let day = Date.UTC(2026, 0, 1); day < Date.UTC(2027, 0, 1); day += 86_400_000) {
      const value = new Date(day).toISOString().slice(0, 10);
      const nextDay = new Date(day + 86_400_000).toISOString().slice(0, 10);

      if (daysPastIsoDate(value, new Date(`${nextDay}T12:00:00`)) !== 1) mismatches.push(value);
    }

    expect(mismatches).toEqual([]);
  });

  it.each([null, 'unknown', '2026-02-31'])('does not classify %s', (value) => {
    expect(daysPastIsoDate(value, today)).toBeNull();
  });
});

describe('isPastIsoDate', () => {
  const today = new Date('2026-09-02T12:00:00');

  it('classifies only earlier dates as past', () => {
    expect(isPastIsoDate('2026-09-01', today)).toBe(true);
    expect(isPastIsoDate('2026-09-02', today)).toBe(false);
    expect(isPastIsoDate('2026-09-03', today)).toBe(false);
  });

  it('does not classify a missing or unparseable value', () => {
    expect(isPastIsoDate(null, today)).toBe(false);
    expect(isPastIsoDate('unknown', today)).toBe(false);
    expect(isPastIsoDate('2025-13-01', today)).toBe(false);
    expect(isPastIsoDate('2025-02-31', today)).toBe(false);
  });

  it('reads the calendar day off the text, so the result does not shift with the local timezone', () => {
    expect(isPastIsoDate('2026-09-01T23:59:59Z', today)).toBe(true);
    expect(isPastIsoDate('2026-09-02T00:00:00Z', today)).toBe(false);
  });
});
