import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ForwardedRef,
  type ReactElement,
  type RefAttributes,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Column } from 'primereact/column';
import { PaginatorTable, twMerge } from '../iwa';
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
import { useResponsiveFields } from './useResponsiveFields';

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
    onSortClear,
    className,
    ...rest
  }: GenericDataTableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const tableId = useId();
  const singleRowExpansion = config.singleRowExpansion ?? true;
  const hasError = error !== null && error !== undefined && error !== false;
  const safePage = Math.max(1, Math.trunc(page));
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const tableRows = useMemo(() => rows.map((row) => row as unknown as PrimeDataTableRow), [rows]);
  const { containerRef, containerWidth, visibleFields, accordionFields } = useResponsiveFields({
    fields: config.fields,
    columnOrder: config.columnOrder,
  });
  const hasDetails = accordionFields.length > 0;
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

  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [containerRef, ref],
  );

  // When the sorted column drops into the accordion, ask the owner to clear
  // the sort. Guarded by measurement so the pre-measure minimal split never
  // wipes a valid sort, and by the last-cleared key so it fires once.
  const visibleSortKeys = useMemo(
    () => new Set(visibleFields.map((field) => field.sortField ?? String(field.field))),
    [visibleFields],
  );
  const lastClearedSortRef = useRef<string | null>(null);
  useEffect(() => {
    if (!sortField || !onSortClear) return;
    if (containerWidth === null || containerWidth <= 0) return;
    if (visibleSortKeys.has(sortField)) {
      lastClearedSortRef.current = null;
      return;
    }
    if (lastClearedSortRef.current === sortField) return;
    lastClearedSortRef.current = sortField;
    onSortClear();
  }, [containerWidth, onSortClear, sortField, visibleSortKeys]);

  const getDetailsId = (row: T) => `${tableId}-details-${encodeURIComponent(getRowKey(row))}`;

  return (
    <div
      ref={setRootRef}
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

      <PaginatorTable
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
              fields={accordionFields}
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
        size="small"
        className={DATA_TABLE_CLASS_NAME}
        tableClassName="w-full table-fixed text-sm"
        paginatorClassName="border-t border-[var(--navigation-accent)] bg-[var(--surface)]"
        paginatorTemplate={paginatorTemplate}
        pt={dataTablePassThrough}
      >
        {visibleFields.map((field) => (
          <Column
            key={String(field.field)}
            columnKey={String(field.field)}
            field={String(field.field)}
            header={t(field.labelKey)}
            sortable={field.sortable}
            sortField={field.sortField ?? String(field.field)}
            style={{ width: `${field.width}px` }}
            headerClassName={twMerge('whitespace-normal', field.headerClassName)}
            bodyClassName={twMerge('whitespace-nowrap', field.cellClassName)}
            body={(primeRow: PrimeDataTableRow, options: PrimeColumnBodyOptions) => (
              <PrimaryCell
                column={field}
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
            headerClassName="w-11 min-w-11 bg-[var(--surface)] p-0 sm:w-9 sm:min-w-9"
            bodyClassName="w-11 min-w-11 bg-[var(--surface)] p-0 text-center sm:w-9 sm:min-w-9"
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
      </PaginatorTable>
    </div>
  );
}

/**
 * A typed, vendor-neutral table seam for lazy server data. Pagination is
 * 1-based at this public boundary; URL/Redux ownership remains with the
 * caller. Which configured fields render as columns is decided at runtime by
 * `useResponsiveFields`, so the table never scrolls horizontally — overflow
 * fields move to the expanded-row accordion.
 */
export const GenericDataTable = forwardRef(GenericDataTableInner) as GenericDataTableComponent;
