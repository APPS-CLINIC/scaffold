/** Shared numeric day-month-year format used by list views and table cells. */
export const DATE_DMY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

export function formatDmyDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, DATE_DMY_FORMAT_OPTIONS).format(date);
}
