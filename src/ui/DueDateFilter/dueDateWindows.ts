import { daysPastIsoDate } from '@/i18n/dateFormats';

export const DUE_DATE_WINDOWS = ['upTo30Days', 'over30Days', 'overdue'] as const;

export type DueDateWindow = (typeof DUE_DATE_WINDOWS)[number];

/** The chosen windows; no window chosen means every item. */
export type DueDateSelection = readonly DueDateWindow[];

export const ALL_DUE_DATES: DueDateSelection = [];

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
 * Keeps the items whose date falls into one of the chosen windows; with no window chosen it
 * keeps every item, with or without a date. It filters a fully loaded collection — a
 * server-paginated list has to send the windows to its endpoint instead.
 */
export function filterByDueDate<T>(
  items: readonly T[],
  getDate: (item: T) => string | null,
  windows: DueDateSelection,
  today = new Date(),
): T[] {
  if (windows.length === 0) return [...items];
  return items.filter((item) => {
    const window = dueDateWindow(getDate(item), today);
    return window !== null && windows.includes(window);
  });
}
