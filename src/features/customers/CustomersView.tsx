import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import {
  GenericDataTable,
  type GenericDataTableLabels,
  type GenericDataTablePageChange,
  type GenericDataTableSortChange,
} from '@/ui';
import { ActionLink, Card, ScreenHeading, Switch } from '@/ui/iwa';
import { customerTableConfig } from './customerTable';
import { useGetCustomersQuery } from './customers.api';
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

  const labels = useMemo<GenericDataTableLabels<Customer>>(
    () => ({
      table: t('customers.table.ariaLabel'),
      loading: t('customers.table.loading'),
      empty: t('customers.table.empty'),
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

  const visibleRowKeys = useMemo(
    () => (data?.content ?? []).map((customer) => String(customer.id)),
    [data?.content],
  );
  const allVisibleRowsExpanded =
    visibleRowKeys.length > 0 && visibleRowKeys.every((key) => expandedRowKeys.includes(key));
  const dataAsOf = useMemo(
    () =>
      new Intl.DateTimeFormat(
        i18n.resolvedLanguage ?? i18n.language,
        DATE_DMY_FORMAT_OPTIONS,
      ).format(new Date(fulfilledTimeStamp ?? Date.now())),
    [fulfilledTimeStamp, i18n.language, i18n.resolvedLanguage],
  );

  return (
    <section
      aria-label={t('customers.title')}
      className="w-full min-w-0 max-w-full space-y-4 overflow-hidden"
    >
      <header>
        <ScreenHeading pageName={t('customers.title')} items={[]} />
        <p className="sr-only">{t('customers.description')}</p>
      </header>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
        <span>{t('customers.dataAsOf')}</span>
        <strong className="font-semibold text-[var(--text)]">{dataAsOf}</strong>
        <ActionLink
          className="text-xs"
          icon={<span aria-hidden="true" className="pi pi-refresh text-xs" />}
          label={t('customers.actions.refresh')}
          onClick={() => void refetch()}
        />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 rounded bg-[var(--surface-muted)] px-3 py-2">
          <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-[var(--muted)]">
            <span>{t('customers.actions.expandAll')}</span>
            <Switch
              checked={allVisibleRowsExpanded}
              disabled={visibleRowKeys.length === 0}
              onChange={() => setExpandedRowKeys(allVisibleRowsExpanded ? [] : visibleRowKeys)}
            />
          </label>
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          {t('common.results', { count: data?.page.totalElements ?? 0 })}
        </span>

        <GenericDataTable
          rows={data?.content ?? []}
          config={customerTableConfig}
          totalRecords={data?.page.totalElements ?? 0}
          page={listQuery.page}
          pageSize={listQuery.pageSize}
          pageSizeOptions={[10, 25, 50]}
          sortField={listQuery.sort || undefined}
          sortOrder={listQuery.sort ? listQuery.dir : undefined}
          loading={isLoading || isFetching}
          initialLoading={isLoading}
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
    </section>
  );
}
