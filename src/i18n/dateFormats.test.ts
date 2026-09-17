import { describe, expect, it } from 'vitest';
import { DATE_DMY_FORMAT_OPTIONS, formatIsoDmyDate, isPastIsoDate } from './dateFormats';

describe('formatIsoDmyDate', () => {
  it.each(['pl', 'en'])('formats a yyyy-MM-dd date for %s', (locale) => {
    const expected = new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(
      new Date('2026-08-31T12:00:00'),
    );

    expect(formatIsoDmyDate('2026-08-31', locale)).toBe(expected);
  });

  it.each(['invalid', '2026-02-31', '2026-13-01', '2026-08-31T00:00:00Z'])(
    'preserves a value that is not a yyyy-MM-dd date: %s',
    (value) => {
      expect(formatIsoDmyDate(value, 'pl')).toBe(value);
    },
  );
});

describe('isPastIsoDate', () => {
  const today = new Date('2026-09-02T12:00:00');

  it('classifies only earlier calendar days as past', () => {
    expect(isPastIsoDate('2026-09-01', today)).toBe(true);
    expect(isPastIsoDate('2026-09-02', today)).toBe(false);
    expect(isPastIsoDate('2026-09-03', today)).toBe(false);
  });

  it('does not classify a missing value, an impossible day or a timestamp', () => {
    expect(isPastIsoDate(null, today)).toBe(false);
    expect(isPastIsoDate('unknown', today)).toBe(false);
    expect(isPastIsoDate('2025-13-01', today)).toBe(false);
    expect(isPastIsoDate('2025-02-31', today)).toBe(false);
    expect(isPastIsoDate('2026-09-01T23:59:59Z', today)).toBe(false);
  });
});
