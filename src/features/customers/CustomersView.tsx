import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import {
  Button,
  GenericDataTable,
  Select,
  TextInput,
  type GenericDataTableLabels,
  type GenericDataTablePageChange,
  type GenericDataTableSortChange,
} from '@/ui';
import { customerTableConfig } from './customerTable';
import { useGetCustomersQuery } from './customers.api';
import {
  selectCustomerQuery,
  updateCustomerUrlFilters,
  type CustomerFilters,
} from './customers.filters';
import type { Customer } from './customers.types';

const customerTypes = ['Corporate'] as const;

export function CustomersView() {
  const { t, i18n } = useTranslation();
  const listQuery = useAppSelector(selectListQuery);
  const customerQuery = useAppSelector(selectCustomerQuery);
  const { setQuery } = useListQueryState();
  const { data, isLoading, isFetching, isError, fulfilledTimeStamp, refetch } =
    useGetCustomersQuery(customerQuery);
  const [filtersExpanded, setFiltersExpanded] = useState(() =>
    Boolean(customerQuery.status || customerQuery.type),
  );
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly string[]>([]);

  useEffect(() => {
    if (customerQuery.status || customerQuery.type) setFiltersExpanded(true);
  }, [customerQuery.status, customerQuery.type]);

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

  const updateFilters = (patch: Partial<CustomerFilters>) => {
    setQuery({ filters: updateCustomerUrlFilters(listQuery.filters, patch) });
  };

  const clearFilters = () => {
    setQuery({
      q: '',
      filters: updateCustomerUrlFilters(listQuery.filters, { status: '', type: '' }),
    });
  };

  const handlePageChange = ({ page, pageSize }: GenericDataTablePageChange) => {
    setQuery({ page, pageSize }, { resetPage: false });
  };

  const handleSortChange = ({ field, order }: GenericDataTableSortChange) => {
    setQuery({ sort: field, dir: order });
  };

  const customerFiltersActive = Boolean(listQuery.q || customerQuery.status || customerQuery.type);
  const activeFilterCount =
    Number(Boolean(customerQuery.status)) + Number(Boolean(customerQuery.type));
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            aria-controls="customer-advanced-filters"
            aria-expanded={filtersExpanded}
            className="min-h-8 px-3 py-1 text-xs font-semibold"
            onClick={() => setFiltersExpanded((current) => !current)}
          >
            <span aria-hidden="true" className="pi pi-sliders-h mr-1.5" />
            {t('customers.actions.customizeFilters')}
          </Button>
          {activeFilterCount > 0 ? (
            <span className="text-xs text-[var(--muted)]">
              {t('customers.filters.activeCount', { count: activeFilterCount })}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="block min-w-0 flex-1 sm:max-w-md">
            <span className="sr-only">{t('common.search')}</span>
            <span className="relative block">
              <TextInput
                value={listQuery.q}
                className="min-h-9 w-full pr-9 text-base sm:text-sm"
                placeholder={t('customers.search.placeholder')}
                onChange={(event) => setQuery({ q: event.currentTarget.value }, { replace: true })}
              />
              <span
                aria-hidden="true"
                className="pi pi-search pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--navigation-accent)]"
              />
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            {customerFiltersActive ? (
              <Button
                variant="ghost"
                className="min-h-11 !border-0 px-2 text-xs text-[var(--link)] underline underline-offset-2"
                onClick={clearFilters}
              >
                {t('customers.actions.clearFilters')}
              </Button>
            ) : null}
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
        </div>

        {filtersExpanded ? (
          <div
            id="customer-advanced-filters"
            className="mt-3 grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-3 sm:grid-cols-2"
          >
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                {t('customers.filters.status')}
              </span>
              <Select
                value={customerQuery.status}
                className="min-h-9 w-full text-base sm:text-sm"
                onChange={(event) =>
                  updateFilters({ status: event.currentTarget.value as CustomerFilters['status'] })
                }
              >
                <option value="">{t('customers.filters.allStatuses')}</option>
                <option value="active">{t('customers.filters.active')}</option>
                <option value="inactive">{t('customers.filters.inactive')}</option>
              </Select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                {t('customers.filters.type')}
              </span>
              <Select
                value={customerQuery.type}
                className="min-h-9 w-full text-base sm:text-sm"
                onChange={(event) => updateFilters({ type: event.currentTarget.value })}
              >
                <option value="">{t('customers.filters.allTypes')}</option>
                {customerTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        ) : null}

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
