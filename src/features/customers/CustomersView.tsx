import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import { useTableColumnSettings } from '@/features/tableSettings';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import {
  ActionLink,
  Card,
  GenericDataTable,
  GenericTableSettings,
  IconTextButton,
  SearchWithAutocomplete,
  TableColumnSettingsDialog,
  type GenericDataTableField,
  type GenericDataTableLabels,
  type GenericDataTablePageChange,
  type GenericDataTableSortChange,
} from '@/ui';
import { customerTableConfig } from './customerTable';
import { useGetCustomersQuery, useExportCustomersMutation } from './customers.api';
import { selectCustomerQuery } from './customers.filters';
import type { Customer } from './customers.types';

export function CustomersView() {
  const { t, i18n } = useTranslation();
  const listQuery = useAppSelector(selectListQuery);
  const customerQuery = useAppSelector(selectCustomerQuery);
  const { setQuery } = useListQueryState();
  const { data, isLoading, isFetching, isError, fulfilledTimeStamp, refetch } =
    useGetCustomersQuery(customerQuery);
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly string[]>([]);
  const tableSettings = useTableColumnSettings(customerTableConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const labels = useMemo<GenericDataTableLabels<Customer>>(
    () => ({
      table: t('customers.table.ariaLabel'),
      loading: t('customers.table.loading'),
      empty: t('customers.table.empty'),
      emptyHint: t('customers.table.emptyHint'),
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
  const handleExport = async () => {
    await exportCustomers({
      locale: i18n.resolvedLanguage ?? i18n.language,
    });
  };

  // A changed column set changes what the accordion shows, so open rows close.
  const handleSettingsSave = (columns: readonly GenericDataTableField<Customer>[]) => {
    tableSettings.saveColumns(columns);
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
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
          <span>{t('customers.dataAsOf')}</span>
          <strong className="font-bold text-[var(--text)]">{dataAsOf}</strong>
          <ActionLink
            icon={<span aria-hidden="true" className="pi pi-refresh text-sm" />}
            label={t('customers.actions.refresh')}
            onClick={async () => {
              await refetch();
            }}
          />
        </div>

        {/* Filter section: controls only for now — no filtering or search
            actions are wired yet (deferred with the rest of the filter model). */}
        <div className="mb-4 flex flex-col items-start gap-8 rounded bg-[var(--surface-muted)] p-3">
          <IconTextButton
            secondary
            icon={<span aria-hidden="true" className="pi pi-sliders-h text-sm" />}
            label={t('customers.actions.customizeFilters')}
          />
          <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <SearchWithAutocomplete
              className="w-full max-w-96 [&_input]:!bg-[var(--surface)] [&_input]:!border-[var(--border)] [&_input:focus]:!border-[var(--navigation-accent)] [&_input:focus]:![box-shadow:none] [&_input:focus]:!outline-none"
              placeholder={t('customers.search.placeholder')}
            />
            <GenericTableSettings
              dataContent={data?.content}
              onExpandedRowKeysChange={setExpandedRowKeys}
              expandedRowKeys={expandedRowKeys}
              handleExport={handleExport}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </div>

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
          loading={isLoading || isFetching}
          error={isError ? t('customers.table.error') : undefined}
          labels={labels}
          expandedRowKeys={expandedRowKeys}
          onExpandedRowKeysChange={setExpandedRowKeys}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onSortClear={handleSortClear}
          aria-busy={isLoading || isFetching}
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
    </section>
  );
}
