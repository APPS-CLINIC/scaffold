import {
  cloneElement,
  forwardRef,
  useId,
  useMemo,
  useState,
  type ComponentType,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import type { PaginatorTemplate } from 'primereact/paginator';
import type { MessageKey } from '@/i18n/messages/pl';
import { cx } from './cx';

export type GenericDataTableField<T extends object> = Extract<keyof T, string>;

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
  onPageChange: (change: GenericDataTablePageChange) => void;
  onSortChange: (change: GenericDataTableSortChange) => void;
}

interface GenericDataTableComponent {
  <T extends object>(
    props: GenericDataTableProps<T> & RefAttributes<HTMLDivElement>,
  ): ReactElement | null;
}

interface PrimeColumnBodyOptions {
  rowIndex: number;
}

interface PrimePageEvent {
  first: number;
  rows: number;
}

interface PrimeSortEvent {
  sortField: string;
  sortOrder: 1 | 0 | -1 | null | undefined;
}

type PrimeDataTableRow = Record<string, unknown>;
type ExpandedRowKeys = Record<string, boolean>;
type PaginatorTemplateConfig = Exclude<PaginatorTemplate, string | undefined>;

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function createExpandedRowKeys(keys: readonly string[] = []): ExpandedRowKeys {
  const expanded = Object.create(null) as ExpandedRowKeys;
  for (const key of keys) expanded[key] = true;
  return expanded;
}

function withAriaLabel(element: ReactElement, label: string | undefined): ReactElement {
  if (!label) return element;

  return cloneElement(element as ReactElement<Record<string, unknown>>, {
    'aria-label': label,
  });
}

function createPaginatorTemplate(
  labels: GenericDataTablePaginatorActionLabels | undefined,
): PaginatorTemplateConfig | undefined {
  if (!labels) return undefined;

  return {
    layout: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown',
    FirstPageLink: (options) => withAriaLabel(options.element, labels.firstPage),
    PrevPageLink: (options) => withAriaLabel(options.element, labels.previousPage),
    PageLinks: (options) => withAriaLabel(options.element, labels.page?.(options.page + 1)),
    NextPageLink: (options) => withAriaLabel(options.element, labels.nextPage),
    LastPageLink: (options) => withAriaLabel(options.element, labels.lastPage),
  };
}

function getRowKey<T extends object>(row: T, dataKey: GenericDataTableDataKey<T>): string {
  return String(row[dataKey]);
}

function renderDefaultDetail(value: unknown, notAvailable: ReactNode): ReactNode {
  if (value === null || value === undefined) return notAvailable;

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return notAvailable;
  }
}

function PrimaryCell<T extends object>({
  column,
  row,
  rowIndex,
}: {
  column: GenericDataTableColumn<T>;
  row: T;
  rowIndex: number;
}) {
  const field = column.field;
  const Component = column.component as unknown as GenericDataTableCellComponent<
    T,
    GenericDataTableField<T>
  >;

  return <Component row={row} value={row[field]} field={field} rowIndex={rowIndex} />;
}

function DetailValue<T extends object>({
  detail,
  labels,
  row,
  rowIndex,
}: {
  detail: GenericDataTableDetailField<T>;
  labels: GenericDataTableLabels<T>;
  row: T;
  rowIndex: number;
}) {
  const field = detail.field;
  const value = row[field];

  if (!detail.component) return renderDefaultDetail(value, labels.notAvailable);

  const Component = detail.component as unknown as GenericDataTableCellComponent<
    T,
    GenericDataTableField<T>
  >;

  return <Component row={row} value={value} field={field} rowIndex={rowIndex} />;
}

function GenericDataTableInner<T extends object>(
  {
    rows,
    config,
    totalRecords,
    page,
    pageSize,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    sortField,
    sortOrder,
    loading = false,
    error,
    labels,
    onPageChange,
    onSortChange,
    className,
    ...rest
  }: GenericDataTableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { t } = useTranslation();
  const tableId = useId();
  const [expandedRows, setExpandedRows] = useState<ExpandedRowKeys>(createExpandedRowKeys);
  const singleRowExpansion = config.singleRowExpansion ?? true;
  const hasDetails = config.detailFields.length > 0;
  const hasError = error !== null && error !== undefined && error !== false;
  const safePage = Math.max(1, Math.trunc(page));
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const tableRows = useMemo(() => rows.map((row) => row as unknown as PrimeDataTableRow), [rows]);
  const paginatorTemplate = useMemo(
    () => createPaginatorTemplate(labels.paginatorActions),
    [labels.paginatorActions],
  );

  const isExpanded = (row: T) => expandedRows[getRowKey(row, config.dataKey)] === true;

  const toggleRow = (row: T) => {
    const rowKey = getRowKey(row, config.dataKey);

    setExpandedRows((current) => {
      if (current[rowKey] === true) {
        const remainingKeys = Object.keys(current).filter((key) => key !== rowKey);
        return createExpandedRowKeys(remainingKeys);
      }

      if (singleRowExpansion) return createExpandedRowKeys([rowKey]);

      return createExpandedRowKeys([...Object.keys(current), rowKey]);
    });
  };

  const getDetailsId = (row: T) =>
    `${tableId}-details-${encodeURIComponent(getRowKey(row, config.dataKey))}`;

  return (
    <div ref={ref} className={cx('w-full min-w-0 max-w-full overflow-hidden', className)} {...rest}>
      {loading ? (
        <span className="sr-only" role="status" aria-live="polite">
          {labels.loading}
        </span>
      ) : null}

      {hasError ? (
        <div
          className="mb-3 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <DataTable
        value={tableRows}
        dataKey={String(config.dataKey)}
        lazy
        paginator
        alwaysShowPaginator
        first={(safePage - 1) * safePageSize}
        rows={safePageSize}
        rowsPerPageOptions={[...pageSizeOptions]}
        totalRecords={Math.max(0, totalRecords)}
        sortField={sortField}
        sortOrder={sortOrder === 'asc' ? 1 : sortOrder === 'desc' ? -1 : undefined}
        removableSort={false}
        loading={loading}
        emptyMessage={
          loading || hasError ? null : (
            <span className="inline-block py-6" role="status">
              {labels.empty}
            </span>
          )
        }
        expandedRows={expandedRows}
        rowExpansionTemplate={(primeRow: PrimeDataTableRow, options: { index: number }) => {
          const row = primeRow as unknown as T;
          const detailsId = getDetailsId(row);

          return (
            <section
              id={detailsId}
              aria-labelledby={`${detailsId}-toggle`}
              className="border-l-2 border-[var(--accent)] bg-[var(--surface-muted)] px-4 py-5 sm:px-6"
            >
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                {config.detailFields.map((detail) => (
                  <div className="min-w-0" key={String(detail.field)}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t(detail.labelKey)}
                    </dt>
                    <dd className="mt-1 break-words text-base sm:text-sm">
                      <DetailValue
                        detail={detail}
                        labels={labels}
                        row={row}
                        rowIndex={options.index}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        }}
        onPage={(event: PrimePageEvent) => {
          const nextPageSize = Math.max(1, event.rows);
          onPageChange({
            page: Math.floor(Math.max(0, event.first) / nextPageSize) + 1,
            pageSize: nextPageSize,
          });
        }}
        onSort={(event: PrimeSortEvent) => {
          if (event.sortOrder !== 1 && event.sortOrder !== -1) return;
          onSortChange({
            field: event.sortField,
            order: event.sortOrder === 1 ? 'asc' : 'desc',
          });
        }}
        scrollable
        size="small"
        className="w-full max-w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]"
        tableClassName="min-w-full text-base sm:text-sm"
        paginatorClassName="border-t border-[var(--border)] bg-[var(--surface)]"
        paginatorTemplate={paginatorTemplate}
        pt={{
          wrapper: {
            className: 'touch-pan-x overflow-x-auto overscroll-x-contain',
          },
          table: {
            'aria-label': labels.table,
            'aria-busy': loading,
          },
          bodyRow: {
            className:
              'transition-colors hover:bg-[var(--surface-muted)] motion-reduce:transition-none',
          },
          paginator: {
            root: {
              role: 'navigation',
              'aria-label': labels.pagination,
              className: 'flex-wrap gap-1 px-2 py-2',
            },
            firstPageButton: { className: 'min-h-11 min-w-11' },
            prevPageButton: { className: 'min-h-11 min-w-11' },
            pageButton: { className: 'min-h-11 min-w-11' },
            nextPageButton: { className: 'min-h-11 min-w-11' },
            lastPageButton: { className: 'min-h-11 min-w-11' },
            RPPDropdown: {
              input: {
                'aria-label': labels.paginatorActions?.rowsPerPage,
              },
            },
          },
          column: {
            headerCell: {
              className:
                'border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]',
            },
            headerContent: { className: 'min-h-11' },
            bodyCell: {
              className:
                'border-b border-[var(--border-subtle)] px-4 py-3 align-middle text-base sm:text-sm',
            },
          },
        }}
      >
        {hasDetails ? (
          <Column
            columnKey="__row_details__"
            headerClassName="w-14 min-w-14 p-0"
            bodyClassName="w-14 min-w-14 p-0 text-center"
            body={(primeRow: PrimeDataTableRow) => {
              const row = primeRow as unknown as T;
              const expanded = isExpanded(row);
              const detailsId = getDetailsId(row);

              return (
                <button
                  id={`${detailsId}-toggle`}
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] motion-reduce:transition-none"
                  aria-controls={detailsId}
                  aria-expanded={expanded}
                  aria-label={expanded ? labels.collapseRow(row) : labels.expandRow(row)}
                  onClick={() => toggleRow(row)}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      'text-lg leading-none transition-transform motion-reduce:transition-none',
                      expanded && 'rotate-90',
                    )}
                  >
                    ›
                  </span>
                </button>
              );
            }}
          />
        ) : null}

        {config.columns.map((column) => (
          <Column
            key={String(column.field)}
            columnKey={String(column.field)}
            field={String(column.field)}
            header={t(column.headerKey)}
            sortable={column.sortable}
            sortField={column.sortField ?? String(column.field)}
            headerClassName={cx('whitespace-nowrap', column.headerClassName)}
            bodyClassName={cx('whitespace-nowrap', column.cellClassName)}
            body={(primeRow: PrimeDataTableRow, options: PrimeColumnBodyOptions) => (
              <PrimaryCell
                column={column}
                row={primeRow as unknown as T}
                rowIndex={options.rowIndex}
              />
            )}
          />
        ))}
      </DataTable>
    </div>
  );
}

/**
 * A typed, vendor-neutral table seam for lazy server data. Pagination is
 * 1-based at this public boundary; URL/Redux ownership remains with the caller.
 */
export const GenericDataTable = forwardRef(GenericDataTableInner) as GenericDataTableComponent;
