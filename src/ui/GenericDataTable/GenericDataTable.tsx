import {
  forwardRef,
  useId,
  useMemo,
  type ForwardedRef,
  type ReactElement,
  type RefAttributes,
} from 'react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'iwa-react-components';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { ExpandedRowContent, PrimaryCell, RowExpansionButton } from './components';
import {
  createDataTablePassThrough,
  createPaginatorTemplate,
  DATA_TABLE_CLASS_NAME,
  DEFAULT_PAGE_SIZE_OPTIONS,
  mapPageEvent,
  mapSortEvent,
  type PrimeColumnBodyOptions,
  type PrimeDataTableRow,
  type PrimePageEvent,
  type PrimeSortEvent,
} from './GenericDataTable.prime';
import type { GenericDataTableProps } from './GenericDataTable.types';
import { useExpandedRows } from './useExpandedRows';

interface GenericDataTableComponent {
  <T extends object>(
    props: GenericDataTableProps<T> & RefAttributes<HTMLDivElement>,
  ): ReactElement | null;
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
    expandedRowKeys,
    onExpandedRowKeysChange,
    onPageChange,
    onSortChange,
    className,
    ...rest
  }: GenericDataTableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const tableId = useId();
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
  const dataTablePassThrough = useMemo(
    () =>
      createDataTablePassThrough(
        labels.table,
        labels.pagination,
        labels.paginatorActions?.rowsPerPage,
        loading,
      ),
    [labels.pagination, labels.paginatorActions?.rowsPerPage, labels.table, loading],
  );
  const { expandedRows, getRowKey, isExpanded, toggleRow } = useExpandedRows({
    dataKey: config.dataKey,
    expandedRowKeys,
    singleRowExpansion,
    onExpandedRowKeysChange,
  });

  const getDetailsId = (row: T) => `${tableId}-details-${encodeURIComponent(getRowKey(row))}`;

  return (
    <div
      ref={ref}
      className={twMerge('w-full min-w-0 max-w-full overflow-hidden', className)}
      {...rest}
    >
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

          return (
            <ExpandedRowContent
              details={config.detailFields}
              detailsId={getDetailsId(row)}
              labels={labels}
              locale={locale}
              row={row}
              rowIndex={options.index}
            />
          );
        }}
        onPage={(event: PrimePageEvent) => onPageChange(mapPageEvent(event))}
        onSort={(event: PrimeSortEvent) => {
          const change = mapSortEvent(event);
          if (change) onSortChange(change);
        }}
        scrollable
        size="small"
        className={DATA_TABLE_CLASS_NAME}
        tableClassName="min-w-[82rem] table-fixed text-sm"
        paginatorClassName="border-t border-[var(--navigation-accent)] bg-[var(--surface)]"
        paginatorTemplate={paginatorTemplate}
        pt={dataTablePassThrough}
      >
        {config.columns.map((column) => (
          <Column
            key={String(column.field)}
            columnKey={String(column.field)}
            field={String(column.field)}
            header={t(column.headerKey)}
            sortable={column.sortable}
            sortField={column.sortField ?? String(column.field)}
            headerClassName={twMerge('whitespace-normal', column.headerClassName)}
            bodyClassName={twMerge('whitespace-nowrap', column.cellClassName)}
            body={(primeRow: PrimeDataTableRow, options: PrimeColumnBodyOptions) => (
              <PrimaryCell
                column={column}
                locale={locale}
                notAvailable={labels.notAvailable}
                row={primeRow as unknown as T}
                rowIndex={options.rowIndex}
              />
            )}
          />
        ))}

        {hasDetails ? (
          <Column
            columnKey="__row_details__"
            headerClassName="sticky right-0 z-20 w-11 min-w-11 bg-[var(--surface)] p-0 sm:w-9 sm:min-w-9"
            bodyClassName="sticky right-0 z-10 w-11 min-w-11 bg-[var(--surface)] p-0 text-center sm:w-9 sm:min-w-9"
            body={(primeRow: PrimeDataTableRow) => {
              const row = primeRow as unknown as T;

              return (
                <RowExpansionButton
                  detailsId={getDetailsId(row)}
                  expanded={isExpanded(row)}
                  labels={labels}
                  row={row}
                  onToggle={() => toggleRow(row)}
                />
              );
            }}
          />
        ) : null}
      </DataTable>
    </div>
  );
}

/**
 * A typed, vendor-neutral table seam for lazy server data. Pagination is
 * 1-based at this public boundary; URL/Redux ownership remains with the caller.
 */
export const GenericDataTable = forwardRef(GenericDataTableInner) as GenericDataTableComponent;
