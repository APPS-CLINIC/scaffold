// Per-function entry points: the package root re-exports every function, and the
// dev server and the test runner transform each of those modules on first import.
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { format } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';

/** Shared numeric day-month-year format used by list views and table cells. */
export const DATE_DMY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

export function formatDmyDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(date);
}

/** The calendar day of a local date as `yyyy-MM-dd`, the format the service reads. */
export function formatIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * The service sends calendar dates as `yyyy-MM-dd`. A timestamp, a day the month
 * does not have such as `2026-02-31`, or any other spelling of a day such as
 * `2026-1-5` is not a date here.
 */
export function parseIsoDate(value: string): Date | null {
  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) && formatIsoDate(date) === value ? date : null;
}

/** Format an ISO date; a value that is not one is shown as it came. */
export function formatIsoDmyDate(value: string, locale: string): string {
  const date = parseIsoDate(value);
  return date ? formatDmyDate(date, locale) : value;
}

/**
 * Calendar days from an ISO date to `today`: positive in the past, 0 today, negative in the
 * future. A value that is not a date has no count.
 */
export function daysPastIsoDate(value: string | null, today = new Date()): number | null {
  const date = value ? parseIsoDate(value) : null;
  return date ? differenceInCalendarDays(today, date) : null;
}

/** Whether an ISO date lies before `today`'s calendar day. */
export function isPastIsoDate(value: string | null, today = new Date()): boolean {
  const daysPast = daysPastIsoDate(value, today);
  return daysPast !== null && daysPast > 0;
}
