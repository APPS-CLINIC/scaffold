import type { ReactNode } from 'react';
import type { GenericDataTableFieldConfig } from '../GenericDataTable';

/** An applied date-range filter; both edges are optional ISO `yyyy-mm-dd`. */
export interface TableFilterDateRange {
  from?: string;
  to?: string;
}

/** One applied filter: a select value or a date range, keyed by field name. */
export type TableFilterValue = string | TableFilterDateRange;

/** Applied filters for every field whose config declares a `filter`. */
export type TableFilterValues = Readonly<Record<string, TableFilterValue>>;

export interface TableFilterBarLabels {
  /** "Dostosuj filtry" button. */
  customizeFilters: string;
  /** "Wyczyść filtry" link; the active count is appended as ` (n)`. */
  clearFilters: string;
  /** Dialog heading, e.g. "Dostosowujesz filtry". */
  dialogTitle: string;
  save: string;
  cancel: string;
  /** Placeholder of every select in the dialog, e.g. "Wybierz". */
  selectPlaceholder: string;
  searchPlaceholder: string;
}

export interface TableFilterBarProps<T extends object> {
  /**
   * The table's field config; only fields declaring `filter` take part.
   * The same object drives the table, so filters can never drift from it.
   */
  fields: readonly GenericDataTableFieldConfig<T>[];
  /** Applied filter values (owner-controlled, e.g. mirrored from the URL). */
  values: TableFilterValues;
  /**
   * Fires when the user saves the dialog or removes a chip. The payload is
   * the complete next filter state for the declared fields — analogous to
   * `onSortChange` on the table.
   */
  onChange: (values: TableFilterValues) => void;
  labels: TableFilterBarLabels;
  /** BCP-47 locale for chip date formatting. */
  locale: string;
  /** Right-aligned slot next to the search input (e.g. an expand-all switch). */
  endSlot?: ReactNode;
}
