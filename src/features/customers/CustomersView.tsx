import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useAppSelector } from '@/app/hooks';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import type { MessageKey } from '@/i18n/messages/pl';
import { useTableColumnSettings } from '@/features/tableSettings';
import { listLoadCause, type ListLoadCause } from '@/features/urlState/listLoadCause';
import type { ListQuery } from '@/features/urlState/urlState.schema';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import {
  ActionLink,
  Card,
  GenericDataTable,
  GenericSearch,
  GenericTableSettings,
  isFilterableField,
  replaceTableFilters,
  TableColumnSettingsDialog,
  TableFilters,
  Refresh,
  type GenericDataTableField,
  type GenericDataTableLabels,
  type GenericDataTablePageChange,
  type GenericDataTableSortChange,
  LoadingSpinner,
  type LoadingPhase,
  type TableFilterValues,
  type Toast,
  ToastErrorIcon,
  type ToastHandle,
  useLoadingPhase,
  useToast,
} from '@/ui';
import { CustomerExportDialog, type CustomerExportScope } from './CustomerExportDialog';
import { CustomersNoResults } from './CustomersNoResults';
import { CustomersToolbarSkeleton } from './CustomersToolbarSkeleton';
import { customerTableConfig } from './customerTable';
import { useGetCustomersQuery, useExportCustomersMutation } from './customers.api';
import { selectCustomerQuery } from './customers.filters';
import type { Customer, CustomerListRequest } from './customers.types';

const filterableFields = customerTableConfig.fields.filter(isFilterableField);

/** Where a list load stands: on its way, taking long, or failed. */
type CustomersLoadState = Exclude<LoadingPhase, 'idle'> | 'failed';

const LOAD_MESSAGES: Record<CustomersLoadState, MessageKey> = {
  loading: 'customers.loading.fetching',
  slow: 'customers.loading.slow',
  failed: 'customers.loading.failed',
};

const CANCEL_LABELS: Record<ListLoadCause, MessageKey> = {
  first: 'customers.loading.retry',
  search: 'customers.loading.cancelSearch',
  filters: 'customers.loading.cancelFilters',
  other: 'customers.loading.cancel',
};

/** The list on screen: the query in the URL and the request that loaded it. */
interface ShownList {
  listQuery: ListQuery;
  request: CustomerListRequest;
}

export function CustomersView() {
  const { t, i18n } = useTranslation();
  const listQuery = useAppSelector(selectListQuery);
  const customerQuery = useAppSelector(selectCustomerQuery);
  const { setQuery } = useListQueryState();
  const toast = useToast();
  // A new attempt sends the same query again, for "Refresh" and "Cancel and try again".
  const [attempt, setAttempt] = useState(0);
  const request = useMemo<CustomerListRequest>(
    () => (attempt === 0 ? customerQuery : { ...customerQuery, attempt }),
    [attempt, customerQuery],
  );
  const { data, currentData, isLoading, isFetching, isError, fulfilledTimeStamp } =
    useGetCustomersQuery(request);

  const [shown, setShown] = useState<ShownList | null>(null);
  if (currentData !== undefined && !isFetching && shown?.request !== request) {
    setShown({ listQuery, request });
  }
  // Keeps the list on screen in the cache while another one loads, so calling the load off
  // brings it back without a request, however long the load took.
  useGetCustomersQuery(shown?.request ?? skipToken);

  // The data date, the filters and the search wait for the first answer; from then on only
  // the table shows that a list loads.
  const [toolbarReady, setToolbarReady] = useState(false);
  if (!toolbarReady && (data !== undefined || isError)) setToolbarReady(true);
  const loadingPhase = useLoadingPhase(isFetching, JSON.stringify(request));
  const tableLoading = isLoading || loadingPhase !== 'idle';
  // The cause of the load in progress; it stays while the notice outlasts the load.
  const fetchCause = listLoadCause(shown?.listQuery ?? null, listQuery);
  const [loadCause, setLoadCause] = useState(fetchCause);
  if (isFetching && fetchCause !== loadCause) setLoadCause(fetchCause);

  // A search called off stays in the field: the field mounts again with it, cursor inside.
  const [searchField, setSearchField] = useState<{ key: number; text?: string }>({ key: 0 });
  const [filterDialog, setFilterDialog] = useState<TableFilterValues | null>(null);

  // Calling a load off brings back the list on screen. Before any list, it sends the query
  // again; after a search or a filter change, it also takes the user back to that control.
  const cancelLoad = () => {
    if (shown === null) {
      setAttempt((current) => current + 1);
      return;
    }
    if (loadCause === 'search') setSearchField(({ key }) => ({ key: key + 1, text: listQuery.q }));
    if (loadCause === 'filters') setFilterDialog(customerQuery.filters);
    setAttempt(shown.request.attempt ?? 0);
    setQuery(shown.listQuery, { replace: true });
  };
  const cancelLoadRef = useRef(cancelLoad);
  useEffect(() => {
    cancelLoadRef.current = cancelLoad;
  });

  // A failed load keeps the rows hidden, and the notice offers to send it again.
  const tableHidden = tableLoading || isError;
  const loadState: CustomersLoadState | null =
    loadingPhase !== 'idle' ? loadingPhase : isError ? 'failed' : null;

  // One toast for the whole load: it changes its text in place, so a toast shown meanwhile,
  // such as a finished download, keeps its place.
  const loadToast = useMemo<Toast | null>(() => {
    if (loadState === null) return null;
    const failed = loadState === 'failed';
    return {
      persistent: true,
      icon: failed ? <ToastErrorIcon /> : <LoadingSpinner size="16" />,
      message: t(LOAD_MESSAGES[loadState]),
      action: failed
        ? {
            label: t('customers.loading.tryAgain'),
            onClick: () => setAttempt((current) => current + 1),
          }
        : { label: t(CANCEL_LABELS[loadCause]), onClick: () => cancelLoadRef.current() },
    };
  }, [loadCause, loadState, t]);
  const loadNoticeRef = useRef<ToastHandle | null>(null);
  useEffect(() => {
    if (loadToast === null) {
      loadNoticeRef.current?.hide();
      loadNoticeRef.current = null;
    } else if (loadNoticeRef.current === null) {
      loadNoticeRef.current = toast.show(loadToast);
    } else {
      loadNoticeRef.current.update(loadToast);
    }
  }, [loadToast, toast]);
  useEffect(
    () => () => {
      loadNoticeRef.current?.hide();
      loadNoticeRef.current = null;
    },
    [],
  );

  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly string[]>([]);
  const tableSettings = useTableColumnSettings(customerTableConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const labels = useMemo<GenericDataTableLabels<Customer>>(
    () => ({
      table: t('customers.table.ariaLabel'),
      loading: t('customers.table.loading'),
      pagination: t('customers.table.pagination'),
      notAvailable: t('customers.value.notAvailable'),
      detailsColumn: t('customers.table.detailsColumn'),
      expandRow: (row) => t('customers.table.expandRow', { name: row.fullName }),
      collapseRow: (row) => t('customers.table.collapseRow', { name: row.fullName }),
      paginatorActions: {
        firstPage: t('common.pagination.first'),
        previousPage: t('common.pagination.previous'),
        nextPage: t('common.pagination.next'),
        lastPage: t('common.pagination.last'),
        page: (page) => t('common.pagination.page', { page }),
        rowsPerPage: t('common.pagination.rowsPerPage'),
        currentPageReport: (first, last, total) =>
          t('common.pagination.report', { first, last, total }),
      },
    }),
    [t],
  );

  const handlePageChange = ({ page, pageSize }: GenericDataTablePageChange) => {
    setQuery({ page, pageSize }, { resetPage: false });
  };

  const handleSortChange = ({ field, order }: GenericDataTableSortChange) => {
    setQuery({ sort: field, dir: order });
  };

  // The sorted column dropped into the accordion — sorting by an invisible
  // column would be confusing, so fall back to the backend's default order.
  const handleSortClear = () => {
    setQuery({ sort: '', dir: 'asc' }, { resetPage: false });
  };

  const dataAsOf = useMemo(
    () =>
      new Intl.DateTimeFormat(
        i18n.resolvedLanguage ?? i18n.language,
        DATE_DMY_FORMAT_OPTIONS,
      ).format(new Date(fulfilledTimeStamp ?? Date.now())),
    [fulfilledTimeStamp, i18n.language, i18n.resolvedLanguage],
  );

  const [exportCustomers] = useExportCustomersMutation();
  const [exportOpen, setExportOpen] = useState(false);
  const exportOpenerRef = useRef<Element | null>(null);

  const openExport = () => {
    exportOpenerRef.current = document.activeElement;
    setExportOpen(true);
  };
  // The dialog unmounts instead of hiding, so focus goes back to the control that opened it.
  const closeExport = () => {
    setExportOpen(false);
    if (exportOpenerRef.current instanceof HTMLElement) exportOpenerRef.current.focus();
  };

  // The file holds the table's columns in their order and, unless the user asks for all
  // customers, only those the search and the filters leave. It is never sorted.
  const handleExportDownload = async (scope: CustomerExportScope) => {
    closeExport();
    const notice = toast.show({
      persistent: true,
      icon: <LoadingSpinner size="16" />,
      message: t('customers.export.started'),
    });
    try {
      await exportCustomers({
        locale: i18n.resolvedLanguage ?? i18n.language,
        columnSelection: tableSettings.config.fields.map(({ field }) => field),
        ...(scope === 'filtered' ? { q: customerQuery.q, filters: customerQuery.filters } : {}),
      }).unwrap();
      notice.update({ message: t('customers.export.done') });
    } catch {
      notice.update({ icon: <ToastErrorIcon />, message: t('customers.export.failed') });
    }
  };

  // Every filterable field is rewritten, so a filter of a field the table no longer uses goes too.
  const handleFiltersChange = (next: TableFilterValues) => {
    setQuery({ filters: replaceTableFilters(listQuery.filters, filterableFields, next) });
  };

  // A changed column set changes what the accordion shows, so open rows close. A field left
  // out of the table also loses its filter, without a new history entry.
  const handleSettingsSave = (columns: readonly GenericDataTableField<Customer>[]) => {
    tableSettings.saveColumns(columns);
    const unusedFields = filterableFields.filter((field) => !columns.includes(field.field));
    setQuery(
      { filters: replaceTableFilters(listQuery.filters, unusedFields, {}) },
      { replace: true },
    );
    setExpandedRowKeys([]);
    setSettingsOpen(false);
  };

  const handleSettingsRestore = () => {
    tableSettings.restoreDefaults();
    setExpandedRowKeys([]);
    setSettingsOpen(false);
  };

  return (
    <section
      aria-label={t('customers.title')}
      className="w-full min-w-0 max-w-full space-y-4 overflow-hidden"
    >
      <header>
        <h1 className="m-0 text-4xl font-bold leading-[48px] text-[var(--navigation-accent)]">
          {t('customers.title')}
        </h1>
        <p className="sr-only">{t('customers.description')}</p>
      </header>

      {/* The IWA Card stacks .p-card (12px) and .p-card-body (20px) padding;
          the design wants exactly 16px per side, so zero the root and give
          the body the full 16px. */}
      <Card className="!p-0 [&_.p-card-body]:!p-4">
        {toolbarReady ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
              <span>{t('customers.dataAsOf')}</span>
              <strong className="font-bold text-[var(--text)]">{dataAsOf}</strong>
              <ActionLink
                icon={<Refresh />}
                label={t('customers.actions.refresh')}
                onClick={() => setAttempt((current) => current + 1)}
              />
            </div>

            <div className="mb-4 flex flex-col items-start gap-8 rounded bg-[var(--surface-muted)] p-3">
              <TableFilters
                fields={tableSettings.config.fields}
                values={customerQuery.filters}
                onChange={handleFiltersChange}
                dialogValues={filterDialog}
                onDialogValuesChange={setFilterDialog}
              />
              <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <GenericSearch
                  key={searchField.key}
                  value={listQuery.q}
                  initialText={searchField.text}
                  autoFocus={searchField.key > 0}
                  placeholder={t('customers.search.placeholder')}
                  onSearch={(q) => setQuery({ q }, { replace: true })}
                />
                <GenericTableSettings
                  dataContent={tableHidden ? undefined : data?.content}
                  onExpandedRowKeysChange={setExpandedRowKeys}
                  expandedRowKeys={expandedRowKeys}
                  handleExport={openExport}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              </div>
            </div>
          </>
        ) : (
          <CustomersToolbarSkeleton />
        )}

        <span className="sr-only" role="status" aria-live="polite">
          {t('common.results', { count: data?.page.totalElements ?? 0 })}
        </span>

        <GenericDataTable
          rows={data?.content ?? []}
          config={tableSettings.config}
          totalRecords={data?.page.totalElements ?? 0}
          page={listQuery.page}
          pageSize={listQuery.pageSize}
          pageSizeOptions={[10, 25, 50]}
          sortField={listQuery.sort || undefined}
          sortOrder={listQuery.sort ? listQuery.dir : undefined}
          loading={tableHidden}
          noResults={<CustomersNoResults />}
          labels={labels}
          expandedRowKeys={expandedRowKeys}
          onExpandedRowKeysChange={setExpandedRowKeys}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onSortClear={handleSortClear}
          aria-busy={tableLoading}
        />
      </Card>

      <TableColumnSettingsDialog
        open={settingsOpen}
        fields={customerTableConfig.fields}
        columns={tableSettings.columns}
        onSave={handleSettingsSave}
        onCancel={() => setSettingsOpen(false)}
        onRestoreDefaults={handleSettingsRestore}
      />

      {exportOpen ? (
        <CustomerExportDialog
          narrowed={
            customerQuery.q.trim() !== '' ||
            Object.values(customerQuery.filters).some((values) => values.length > 0)
          }
          onDownload={handleExportDownload}
          onCancel={closeExport}
        />
      ) : null}
    </section>
  );
}
