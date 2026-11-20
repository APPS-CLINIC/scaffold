import {
  ActiveArchivalStatusCell,
  DateCell,
  UnderlinedTextCell,
  TextCell,
  DateRangeFilter,
  MultiSelectFilter,
  TextFilter,
  tableFilter,
} from '@/ui';
import type { GenericDataTableCellProps, GenericDataTableConfig, TableFilterOption } from '@/ui';
import type { ListQuery } from '@/features/urlState/urlState.schema';

export interface ExampleRow {
  id: number;
  fullName: string;
  status: 'ACTIVE' | 'ARCHIVAL';
  lendingReviewDate: string | null;
  lendingAdvisor: string | null;
  corporateGroupName: string;
  internalGroupName: string;
}
export const statusOptions: readonly TableFilterOption[] = [
  { value: 'ACTIVE', labelKey: 'common.status.active' },
  { value: 'ARCHIVAL', labelKey: 'common.status.archival' },
];
function NameCell(props: GenericDataTableCellProps<ExampleRow, 'fullName'>) {
  return <UnderlinedTextCell {...props} to={`/customers/${props.row.id}`} />;
}
export const exampleTableConfig: GenericDataTableConfig<ExampleRow> = {
  id: 'storybook-customers',
  dataKey: 'id',
  fields: [
    {
      field: 'fullName',
      labelKey: 'customers.table.field.fullName',
      width: 240,
      alwaysVisible: true,
      sortable: true,
      component: NameCell,
      filter: tableFilter(TextFilter, {}),
    },
    {
      field: 'status',
      labelKey: 'customers.table.field.status',
      width: 120,
      sortable: true,
      component: ActiveArchivalStatusCell,
      filter: tableFilter(MultiSelectFilter, { options: statusOptions }),
    },
    {
      field: 'lendingReviewDate',
      labelKey: 'customers.table.field.lendingReviewDate',
      width: 160,
      sortable: true,
      component: DateCell,
      filter: tableFilter(DateRangeFilter, {}),
    },
    {
      field: 'lendingAdvisor',
      labelKey: 'customers.table.field.lendingAdvisor',
      width: 220,
      sortable: true,
      component: TextCell,
      filter: tableFilter(TextFilter, {}),
    },
    {
      field: 'corporateGroupName',
      labelKey: 'customers.table.field.corporateGroupName',
      width: 240,
      component: TextCell,
    },
    {
      field: 'internalGroupName',
      labelKey: 'customers.table.field.internalGroupName',
      width: 240,
      component: TextCell,
    },
  ],
};

/** Synthetic values, stable identities and fixed calendar dates. */
export function createExampleRows(count = 87): ExampleRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    fullName: `Example company ${String(index + 1).padStart(3, '0')}`,
    status: index % 4 === 0 ? 'ARCHIVAL' : 'ACTIVE',
    lendingReviewDate: index % 5 === 0 ? null : '2030-06-15',
    lendingAdvisor: index % 7 === 0 ? null : `Example advisor ${(index % 6) + 1}`,
    corporateGroupName: `Example group ${(index % 3) + 1}`,
    internalGroupName:
      index % 2 === 0
        ? 'A longer piece of synthetic content that wraps into multiple lines in narrow layouts.'
        : 'Example internal group',
  }));
}

/** A small, synchronous example service; the harness owns any response delay. */
export function queryExampleRows(rows: readonly ExampleRow[], query: ListQuery) {
  const search = query.q.trim().toLocaleLowerCase();
  const found = rows.filter((row) => {
    const { filters } = query;
    const date = row.lendingReviewDate;
    return (
      (!search ||
        `${row.fullName} ${row.lendingAdvisor ?? ''}`.toLocaleLowerCase().includes(search)) &&
      (!filters.status?.length || filters.status.includes(row.status)) &&
      (!filters.fullName?.[0] ||
        row.fullName.toLocaleLowerCase().includes(filters.fullName[0].toLocaleLowerCase())) &&
      (!filters.lendingAdvisor?.[0] ||
        (row.lendingAdvisor ?? '')
          .toLocaleLowerCase()
          .includes(filters.lendingAdvisor[0].toLocaleLowerCase())) &&
      (!filters['lendingReviewDate.from']?.[0] ||
        Boolean(date && date >= filters['lendingReviewDate.from'][0])) &&
      (!filters['lendingReviewDate.to']?.[0] ||
        Boolean(date && date <= filters['lendingReviewDate.to'][0]))
    );
  });
  const field = exampleTableConfig.fields.find(
    (item) => item.field === query.sort && item.sortable,
  )?.field;
  if (field)
    found.sort(
      (a, b) =>
        String(a[field] ?? '').localeCompare(String(b[field] ?? '')) *
        (query.dir === 'desc' ? -1 : 1),
    );
  const start = (query.page - 1) * query.pageSize;
  return { rows: found.slice(start, start + query.pageSize), total: found.length };
}
