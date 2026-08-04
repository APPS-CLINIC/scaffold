import { useMemo } from 'react';
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
import { customerTableConfig } from './customerTable.config';
import { useGetCustomersQuery } from './customers.api';
import {
  selectCustomerQuery,
  updateCustomerUrlFilters,
  type CustomerFilters,
} from './customers.filters';
import type { Customer } from './customers.types';

const customerSectors = [
  'Business Services',
  'Consumer Goods',
  'Energy',
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Real Estate',
  'Retail',
  'Technology',
  'Telecommunications',
  'Transport',
] as const;

export function CustomersPage() {
  const { t } = useTranslation();
  const listQuery = useAppSelector(selectListQuery);
  const customerQuery = useAppSelector(selectCustomerQuery);
  const { setQuery } = useListQueryState();
  const { data, isLoading, isFetching, isError, refetch } = useGetCustomersQuery(customerQuery);

  const labels = useMemo<GenericDataTableLabels<Customer>>(
    () => ({
      table: t('customers.table.ariaLabel'),
      loading: t('customers.table.loading'),
      empty: t('customers.table.empty'),
      pagination: t('customers.table.pagination'),
      notAvailable: t('customers.value.notAvailable'),
      expandRow: (row) => t('customers.table.expandRow', { name: row.customerFullName }),
      collapseRow: (row) => t('customers.table.collapseRow', { name: row.customerFullName }),
      paginatorActions: {
        firstPage: t('common.pagination.first'),
        previousPage: t('common.pagination.previous'),
        nextPage: t('common.pagination.next'),
        lastPage: t('common.pagination.last'),
        page: (page) => t('common.pagination.page', { page }),
        rowsPerPage: t('common.pagination.rowsPerPage'),
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
      filters: updateCustomerUrlFilters(listQuery.filters, { status: '', sector: '' }),
    });
  };

  const handlePageChange = ({ page, pageSize }: GenericDataTablePageChange) => {
    setQuery({ page, pageSize }, { resetPage: false });
  };

  const handleSortChange = ({ field, order }: GenericDataTableSortChange) => {
    setQuery({ sort: field, dir: order });
  };

  const customerFiltersActive = Boolean(
    listQuery.q || customerQuery.status || customerQuery.sector,
  );

  return (
    <section
      aria-labelledby="customers-title"
      className="w-full min-w-0 max-w-full space-y-5 overflow-hidden"
    >
      <header className="space-y-1">
        <h1
          id="customers-title"
          className="text-2xl font-semibold tracking-tight text-[var(--navigation-accent)]"
        >
          {t('customers.title')}
        </h1>
        <p className="text-sm text-[var(--muted)]">{t('customers.description')}</p>
      </header>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(16rem,1fr)_13rem_15rem_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {t('common.search')}
            </span>
            <span className="relative block">
              <TextInput
                value={listQuery.q}
                className="min-h-11 w-full pr-11 text-base"
                placeholder={t('customers.search.placeholder')}
                onChange={(event) => setQuery({ q: event.currentTarget.value }, { replace: true })}
              />
              <span
                aria-hidden="true"
                className="pi pi-search pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {t('customers.filters.status')}
            </span>
            <Select
              value={customerQuery.status}
              className="min-h-11 w-full text-base"
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
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {t('customers.filters.sector')}
            </span>
            <Select
              value={customerQuery.sector}
              className="min-h-11 w-full text-base"
              onChange={(event) => updateFilters({ sector: event.currentTarget.value })}
            >
              <option value="">{t('customers.filters.allSectors')}</option>
              {customerSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </Select>
          </label>

          <Button
            variant="ghost"
            className="min-h-11 whitespace-nowrap px-4"
            disabled={!customerFiltersActive}
            onClick={clearFilters}
          >
            {t('customers.actions.clearFilters')}
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium" role="status" aria-live="polite">
            {t('common.results', { count: data?.page.totalElements ?? 0 })}
          </p>
          <Button
            variant="ghost"
            className="min-h-11 self-start px-4 sm:self-auto"
            onClick={() => void refetch()}
          >
            <span aria-hidden="true" className="pi pi-refresh mr-2" />
            {t('customers.actions.refresh')}
          </Button>
        </div>
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
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        aria-busy={isLoading || isFetching}
      />
    </section>
  );
}
