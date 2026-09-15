/** Shared numeric day-month-year format used by list views and table cells. */
export const DATE_DMY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

export function formatDmyDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(date);
}

interface IsoLocalDate {
  year: string;
  month: string;
  day: string;
  date: Date;
}

/**
 * Accept an ISO local date only when its parts survive a calendar roundtrip, so
 * `2026-02-31` is rejected instead of rolling over into March.
 */
function parseIsoLocalDate(value: string): IsoLocalDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/u.exec(value);
  if (!match) return null;

  const [, year = '', month = '', day = ''] = match;
  const date = new Date(`${year}-${month}-${day}T12:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return { year, month, day, date };
}

/** Format an ISO local-date value without silently normalizing invalid dates. */
export function formatIsoDmyDate(value: string, locale: string): string {
  const parsed = parseIsoLocalDate(value);
  return parsed ? formatDmyDate(parsed.date, locale) : value;
}

const MS_PER_DAY = 86_400_000;

/**
 * Whole calendar days from an ISO local date to `today`'s local calendar date:
 * positive in the past, 0 today, negative in the future. The value's date is
 * read off the text and both days are projected onto UTC midnight, so neither
 * the viewer's timezone nor a DST switch (a 23- or 25-hour local day) can move
 * the count. Values that are not valid ISO local dates are not classified.
 */
export function daysPastIsoDate(value: string | null, today = new Date()): number | null {
  const parsed = value ? parseIsoLocalDate(value) : null;
  if (!parsed) return null;

  const valueDay = Date.UTC(Number(parsed.year), Number(parsed.month) - 1, Number(parsed.day));
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  return (todayDay - valueDay) / MS_PER_DAY;
}

/** Whether an ISO local date lies strictly before `today`'s local calendar date. */
export function isPastIsoDate(value: string | null, today = new Date()): boolean {
  const daysPast = daysPastIsoDate(value, today);
  return daysPast !== null && daysPast > 0;
}
