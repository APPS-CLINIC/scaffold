import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import {
  Button,
  GenericDataTable,
  type GenericDataTableLabels,
  type GenericDataTablePageChange,
  type GenericDataTableSortChange,
} from '@/ui';
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

  const visibleRowKeys = useMemo(
    () => (data?.content ?? []).map((customer) => String(customer.id)),
    [data?.content],
  );
  const allVisibleRowsExpanded =
    visibleRowKeys.length > 0 && visibleRowKeys.every((key) => expandedRowKeys.includes(key));
  const dataAsOf = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(fulfilledTimeStamp ?? Date.now())),
    [fulfilledTimeStamp, i18n.language, i18n.resolvedLanguage],
  );

  return (
    <section
      aria-labelledby="customers-title"
      className="w-full min-w-0 max-w-full space-y-4 overflow-hidden"
    >
      <header>
        <h1
          id="customers-title"
          className="text-2xl font-semibold tracking-tight text-[var(--navigation-accent)]"
        >
          {t('customers.title')}
        </h1>
        <p className="sr-only">{t('customers.description')}</p>
      </header>

      <div className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{t('customers.dataAsOf')}</span>
            <strong className="font-semibold text-[var(--text)] underline underline-offset-2">
              {dataAsOf}
            </strong>
            <Button
              variant="ghost"
              className="min-h-8 !border-0 px-1.5 py-0 text-xs text-[var(--link)] underline underline-offset-2"
              onClick={() => void refetch()}
            >
              <span
                aria-hidden="true"
                className="pi pi-refresh mr-1 text-[var(--navigation-accent)]"
              />
              {t('customers.actions.refresh')}
            </Button>
          </div>

          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap text-xs">
            <span>{t('customers.actions.expandAll')}</span>
            <input
              type="checkbox"
              className="peer sr-only"
              checked={allVisibleRowsExpanded}
              disabled={visibleRowKeys.length === 0}
              onChange={() => setExpandedRowKeys(allVisibleRowsExpanded ? [] : visibleRowKeys)}
            />
            <span className="relative h-4 w-8 rounded-full bg-[var(--inactive)] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-4 peer-disabled:opacity-50 motion-reduce:transition-none motion-reduce:after:transition-none" />
          </label>
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          {t('common.results', { count: data?.page.totalElements ?? 0 })}
        </span>
      </div>

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
        error={isError ? t('customers.table.error') : undefined}
        labels={labels}
        expandedRowKeys={expandedRowKeys}
        onExpandedRowKeysChange={setExpandedRowKeys}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        aria-busy={isLoading || isFetching}
      />
    </section>
  );
}
