// Per-function entry points: the package root re-exports every function, and the
// dev server and the test runner transform each of those modules on first import.
import { isBefore } from 'date-fns/isBefore';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import { startOfDay } from 'date-fns/startOfDay';

/** Shared numeric day-month-year format used by list views and table cells. */
export const DATE_DMY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

export function formatDmyDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(date);
}

/**
 * The service sends calendar dates as `yyyy-MM-dd`. A timestamp, or a day the
 * month does not have such as `2026-02-31`, is not a date here.
 */
function parseIsoDate(value: string): Date | null {
  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) ? date : null;
}

/** Format an ISO date; a value that is not one is shown as it came. */
export function formatIsoDmyDate(value: string, locale: string): string {
  const date = parseIsoDate(value);
  return date ? formatDmyDate(date, locale) : value;
}

/** Whether an ISO date lies before `today`'s calendar day. */
export function isPastIsoDate(value: string | null, today = new Date()): boolean {
  const date = value ? parseIsoDate(value) : null;
  return date !== null && isBefore(date, startOfDay(today));
}
