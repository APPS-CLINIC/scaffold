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

interface GenericDataTableColumnForField<T extends object, K extends GenericDataTableField<T>> {
  field: K;
  headerKey: MessageKey;
  component: GenericDataTableCellComponent<T, K>;
  sortable?: boolean;
  sortField?: string;
  headerClassName?: string;
  cellClassName?: string;
}

/** A discriminated union that keeps each column's field and cell value correlated. */
export type GenericDataTableColumn<T extends object> = {
  [K in GenericDataTableField<T>]: GenericDataTableColumnForField<T, K>;
}[GenericDataTableField<T>];

interface GenericDataTableDetailFieldBase<T extends object, K extends GenericDataTableField<T>> {
  field: K;
  labelKey: MessageKey;
  component?: GenericDataTableCellComponent<T, K>;
}

/**
 * An explicit expanded-row allowlist. Non-primitive values require a custom
 * component so an object can never be exposed accidentally as stringified data.
 */
export type GenericDataTableDetailField<T extends object> = {
  [K in GenericDataTableField<T>]: T[K] extends GenericDataTablePrimitive
    ? GenericDataTableDetailFieldBase<T, K>
    : GenericDataTableDetailFieldBase<T, K> & {
        component: GenericDataTableCellComponent<T, K>;
      };
}[GenericDataTableField<T>];

export interface GenericDataTableConfig<T extends object> {
  dataKey: GenericDataTableDataKey<T>;
  columns: readonly GenericDataTableColumn<T>[];
  detailFields: readonly GenericDataTableDetailField<T>[];
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
  pagination: string;
  notAvailable: ReactNode;
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
}
