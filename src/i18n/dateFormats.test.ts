import { describe, expect, it } from 'vitest';
import { DATE_DMY_FORMAT_OPTIONS, formatIsoDmyDate } from './dateFormats';

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
