import { daysPastIsoDate } from '@/i18n/dateFormats';

export const DUE_DATE_FILTERS = ['all', 'upTo30Days', 'over30Days', 'overdue'] as const;

export type DueDateFilterValue = (typeof DUE_DATE_FILTERS)[number];

/** The window a single date falls into; `all` is a filter, not a window. */
export type DueDateWindow = Exclude<DueDateFilterValue, 'all'>;

export const DEFAULT_DUE_DATE_FILTER: DueDateFilterValue = 'all';

const UPCOMING_DAYS = 30;

/**
 * The window an ISO date falls into relative to `today`: overdue before today, up to 30 days
 * from today through today + 30 days, over 30 days after that. A value that is not a date has
 * no window.
 */
export function dueDateWindow(value: string | null, today = new Date()): DueDateWindow | null {
  const daysPast = daysPastIsoDate(value, today);
  if (daysPast === null) return null;
  if (daysPast > 0) return 'overdue';
  return -daysPast <= UPCOMING_DAYS ? 'upTo30Days' : 'over30Days';
}

/**
 * Keeps the items whose date falls into the filter's window; `all` keeps every item, with or
 * without a date. It filters a fully loaded collection — a server-paginated list has to send
 * the window to its endpoint instead.
 */
export function filterByDueDate<T>(
  items: readonly T[],
  getDate: (item: T) => string | null,
  filter: DueDateFilterValue,
  today = new Date(),
): T[] {
  if (filter === 'all') return [...items];
  return items.filter((item) => dueDateWindow(getDate(item), today) === filter);
}
