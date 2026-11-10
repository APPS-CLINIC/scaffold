import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import {
  GenericDataTable,
  GenericSearch,
  TableActions,
  TableColumnSettingsDialog,
  TableFilters,
  TableToolbar,
  resolveColumnFields,
} from '@/ui';
import { useToast } from '@/ui';
import { createExampleRows, exampleTableConfig, queryExampleRows } from './tableFixtures';
import type { ExampleRow } from './tableFixtures';
import type { GenericDataTableField } from '@/ui';

export interface GenericTableExampleProps {
  width?: number;
  rowCount?: number;
  state?: 'ready' | 'loading' | 'empty' | 'error' | 'async';
  showToolbar?: boolean;
}

/** Stateful owner example: URL query, fake service, expansion and settings around the real table. */
export function GenericTableExample({
  width = 1200,
  rowCount = 87,
  state = 'ready',
  showToolbar = false,
}: GenericTableExampleProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { query, setQuery } = useListQueryState();
  const rows = useMemo(() => createExampleRows(rowCount), [rowCount]);
  const result = useMemo(() => queryExampleRows(rows, query), [rows, query]);
  const key = JSON.stringify({ query, rowCount });
  const [received, setReceived] = useState<{ key: string; data: typeof result } | null>(null);
  const [failed, setFailed] = useState(true);
  useEffect(() => setFailed(true), [state]);
  const [expanded, setExpanded] = useState<readonly string[]>([]);
  const [columns, setColumns] = useState<readonly GenericDataTableField<ExampleRow>[]>(
    exampleTableConfig.fields.map((field) => field.field),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    if (state !== 'async') return;
    const timer = setTimeout(() => setReceived({ key, data: result }), 600);
    return () => clearTimeout(timer);
  }, [key, result, state]);
  const data = state === 'async' ? received?.data : result;
  const error = state === 'error' && failed;
  const loading = state === 'loading' || (state === 'async' && received?.key !== key);
  const config = {
    ...exampleTableConfig,
    fields: resolveColumnFields(exampleTableConfig.fields, columns),
  };
  return (
    <div style={{ width, maxWidth: '100%' }}>
      {showToolbar ? (
        <TableToolbar
          filters={
            <TableFilters
              fields={config.fields}
              values={query.filters}
              onChange={(filters) =>
                setQuery({
                  filters: Object.fromEntries(
                    Object.entries(filters).map(([key, values]) => [key, [...values]]),
                  ),
                })
              }
            />
          }
          search={
            <GenericSearch
              value={query.q}
              onSearch={(q) => setQuery({ q })}
              placeholder={t('customers.search.placeholder')}
            />
          }
          actions={
            <TableActions
              expandableKeys={(data?.rows ?? []).map((row) => String(row.id))}
              expandedKeys={expanded}
              onExpandedKeysChange={setExpanded}
              onOpenSettings={() => setSettingsOpen(true)}
              onExport={() => toast.show({ message: t('customers.export.done') })}
            />
          }
        />
      ) : null}
      <GenericDataTable<ExampleRow>
        config={config}
        rows={state === 'empty' || error ? [] : (data?.rows ?? [])}
        totalRecords={state === 'empty' || error ? 0 : (data?.total ?? 0)}
        page={query.page}
        pageSize={query.pageSize}
        loading={loading}
        sortField={query.sort}
        sortOrder={query.dir}
        expandedRowKeys={expanded}
        onExpandedRowKeysChange={setExpanded}
        onPageChange={({ page, pageSize }) => setQuery({ page, pageSize })}
        onSortChange={({ field, order }) => setQuery({ sort: field, dir: order })}
        onSortClear={() => setQuery({ sort: '' })}
        error={
          error ? (
            <span>
              {t('customers.loading.failed')}{' '}
              <button type="button" className="underline" onClick={() => setFailed(false)}>
                {t('customers.loading.tryAgain')}
              </button>
            </span>
          ) : undefined
        }
        noResults={t('common.empty')}
        labels={{
          table: t('customers.title'),
          loading: t('common.loading'),
          pagination: t('customers.table.pagination'),
          notAvailable: '–',
          expandRow: (row) => t('customers.table.expandRow', { name: row.fullName }),
          collapseRow: (row) => t('customers.table.collapseRow', { name: row.fullName }),
          paginatorActions: {
            nextPage: t('common.pagination.next'),
            previousPage: t('common.pagination.previous'),
          },
        }}
      />
      <TableColumnSettingsDialog
        open={settingsOpen}
        fields={exampleTableConfig.fields}
        columns={columns}
        onSave={(next) => {
          setColumns(next);
          setSettingsOpen(false);
        }}
        onCancel={() => setSettingsOpen(false)}
        onRestoreDefaults={() => {
          setColumns(exampleTableConfig.fields.map((field) => field.field));
          setSettingsOpen(false);
        }}
      />
    </div>
  );
}
