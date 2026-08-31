import type { ComponentType, HTMLAttributes, ReactNode } from 'react';
import type { MessageKey } from '@/i18n/messages/pl';

export type GenericDataTableField<T extends object> = Extract<keyof T, string>;

export type GenericDataTableFieldWithValue<T extends object, V> = {
  [K in GenericDataTableField<T>]-?: Exclude<T[K], null | undefined> extends V ? K : never;
}[GenericDataTableField<T>];

export type GenericDataTablePrimitive = string | number | boolean | bigint | null | undefined;

export type GenericDataTableDataKey<T extends object> = {
  [K in GenericDataTableField<T>]-?: T[K] extends string | number ? K : never;
}[GenericDataTableField<T>];

export interface GenericDataTableCellProps<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
> {
  row: T;
  value: T[K];
  field: K;
  locale: string;
  notAvailable: ReactNode;
  rowIndex: number;
}

export type GenericDataTableCellComponent<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
> = ComponentType<GenericDataTableCellProps<T, K>>;

interface GenericDataTableFieldConfigBase<T extends object, K extends GenericDataTableField<T>> {
  field: K;
  /** Single label used for both the column header and the accordion row. */
  labelKey: MessageKey;
  /** Pixel width the field occupies as a column; the fit engine budgets with it. */
  width: number;
  /** Renders the value in the column cell and in the accordion alike. */
  component?: GenericDataTableCellComponent<T, K>;
  sortable?: boolean;
  /** Server-side sort key when it differs from `field`. */
  sortField?: string;
  /** Never moved to the accordion, regardless of available width. */
  alwaysVisible?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

/**
 * Unified per-field configuration. Whether a field renders as a table column
 * or inside the expanded-row accordion is decided at runtime from the
 * available width — never by the config shape. Non-primitive values require a
 * custom component so an object can never leak as stringified data.
 */
export type GenericDataTableFieldConfig<T extends object> = {
  [K in GenericDataTableField<T>]: T[K] extends GenericDataTablePrimitive
    ? GenericDataTableFieldConfigBase<T, K>
    : GenericDataTableFieldConfigBase<T, K> & {
        component: GenericDataTableCellComponent<T, K>;
      };
}[GenericDataTableField<T>];

export interface GenericDataTableConfig<T extends object> {
  dataKey: GenericDataTableDataKey<T>;
  /** Every field the table can show — as a column when it fits, else in the accordion. */
  fields: readonly GenericDataTableFieldConfig<T>[];
  /**
   * Display-order override. Listed fields render first, in this order; the
   * remaining fields keep their `fields` order after them. Columns drop to
   * the accordion from the end of the resolved order.
   */
  columnOrder?: readonly GenericDataTableField<T>[];
  singleRowExpansion?: boolean;
}

export type GenericDataTableSortOrder = 'asc' | 'desc';

export interface GenericDataTablePageChange {
  page: number;
  pageSize: number;
}

export interface GenericDataTableSortChange {
  field: string;
  order: GenericDataTableSortOrder;
}

export interface GenericDataTablePaginatorActionLabels {
  firstPage?: string;
  previousPage?: string;
  nextPage?: string;
  lastPage?: string;
  page?: (page: number) => string;
  rowsPerPage?: string;
  currentPageReport?: (first: number, last: number, total: number) => string;
}

export interface GenericDataTableLabels<T extends object> {
  table: string;
  loading: string;
  empty: string;
  /** Secondary line under the empty-state heading. */
  emptyHint?: string;
  pagination: string;
  notAvailable: ReactNode;
  /** Screen-reader name for the expansion-toggle column. */
  detailsColumn?: string;
  expandRow: (row: T) => string;
  collapseRow: (row: T) => string;
  paginatorActions?: GenericDataTablePaginatorActionLabels;
}

export interface GenericDataTableProps<T extends object> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  rows: readonly T[];
  config: GenericDataTableConfig<T>;
  totalRecords: number;
  page: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  sortField?: string;
  sortOrder?: GenericDataTableSortOrder;
  loading?: boolean;
  error?: ReactNode;
  labels: GenericDataTableLabels<T>;
  expandedRowKeys?: readonly string[];
  onExpandedRowKeysChange?: (keys: readonly string[]) => void;
  onPageChange: (change: GenericDataTablePageChange) => void;
  onSortChange: (change: GenericDataTableSortChange) => void;
  /**
   * Called when the currently sorted column stops being visible (it dropped
   * into the accordion), so the owner can clear the sort in its store/URL.
   */
  onSortClear?: () => void;
}
