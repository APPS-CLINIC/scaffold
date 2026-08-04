import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import {
  GenericDataTable,
  type GenericDataTableCellProps,
  type GenericDataTableConfig,
  type GenericDataTableProps,
} from '.';

interface TestRow {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  note: string | null;
  metadata: { tier: string };
  secret: string;
}

function NameCell({ field, rowIndex, value }: GenericDataTableCellProps<TestRow, 'name'>) {
  return <span>{`${value}:${field}:${rowIndex}`}</span>;
}

function StatusCell({ value }: GenericDataTableCellProps<TestRow, 'status'>) {
  return <strong>{value.toUpperCase()}</strong>;
}

function MetadataCell({ value }: GenericDataTableCellProps<TestRow, 'metadata'>) {
  return <span>{`Custom metadata: ${value.tier}`}</span>;
}

const rows: readonly TestRow[] = [
  {
    id: 1,
    name: 'Alice',
    status: 'active',
    note: null,
    metadata: { tier: 'gold' },
    secret: 'alice-classified',
  },
  {
    id: 2,
    name: 'Bob',
    status: 'inactive',
    note: 'Follow up',
    metadata: { tier: 'silver' },
    secret: 'bob-classified',
  },
];

const config = {
  dataKey: 'id',
  columns: [
    {
      field: 'name',
      headerKey: 'customers.table.column.name',
      component: NameCell,
      sortable: true,
      sortField: 'displayName',
    },
    {
      field: 'status',
      headerKey: 'customers.table.column.status',
      component: StatusCell,
    },
  ],
  detailFields: [
    {
      field: 'note',
      labelKey: 'customers.table.detail.reviewExtension',
    },
    {
      field: 'metadata',
      labelKey: 'customers.table.detail.internalGroupName',
      component: MetadataCell,
    },
  ],
} as const satisfies GenericDataTableConfig<TestRow>;

const labels = {
  table: 'Test customers',
  loading: 'Loading test customers',
  empty: 'No test customers',
  pagination: 'Test customer pagination',
  notAvailable: 'Not available',
  expandRow: (row: TestRow) => `Expand ${row.name} details`,
  collapseRow: (row: TestRow) => `Collapse ${row.name} details`,
  paginatorActions: {
    firstPage: 'First customer page',
    previousPage: 'Previous customer page',
    nextPage: 'Next customer page',
    lastPage: 'Last customer page',
    page: (page: number) => `Customer page ${page}`,
    rowsPerPage: 'Customers per page',
    currentPageReport: (first: number, last: number, total: number) =>
      `Showing ${first}-${last} of ${total}`,
  },
};

const appendToHead = document.head.appendChild.bind(document.head);

function renderTable(overrides: Partial<GenericDataTableProps<TestRow>> = {}) {
  const props: GenericDataTableProps<TestRow> = {
    rows,
    config,
    totalRecords: 22,
    page: 1,
    pageSize: 10,
    pageSizeOptions: [10, 25],
    labels,
    onPageChange: vi.fn(),
    onSortChange: vi.fn(),
    ...overrides,
  };

  return { props, ...render(<GenericDataTable<TestRow> {...props} />) };
}

beforeEach(async () => {
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    // jsdom 25 does not parse PrimeReact's valid CSS `@layer` blocks.
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  await i18n.changeLanguage('en');
});

describe('GenericDataTable', () => {
  it('renders translated headings and a required custom component for every primary cell', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: /customer name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByText('Alice:name:0')).toBeInTheDocument();
    expect(screen.getByText('Bob:name:1')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-10 of 22')).toBeInTheDocument();

    const aliceRow = screen.getByText('Alice:name:0').closest('tr');
    expect(aliceRow).not.toBeNull();
    if (!aliceRow) return;
    const cells = within(aliceRow).getAllByRole('cell');
    const lastCell = cells.at(-1);
    expect(lastCell).toBeDefined();
    if (!lastCell) return;
    expect(within(lastCell).getByRole('button', { name: 'Expand Alice details' })).toBeVisible();
  });

  it('renders only whitelisted details and safely formats null and custom values', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole('button', { name: 'Expand Alice details' }));

    const details = screen.getByRole('region', { name: 'Collapse Alice details' });
    expect(within(details).getByText('Review extension')).toBeInTheDocument();
    expect(within(details).getByText('Not available')).toBeInTheDocument();
    expect(within(details).getByText('Custom metadata: gold')).toBeInTheDocument();
    expect(screen.queryByText('alice-classified')).not.toBeInTheDocument();
    expect(screen.queryByText('bob-classified')).not.toBeInTheDocument();
  });

  it('behaves as a single-row accordion by default', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole('button', { name: 'Expand Alice details' }));
    expect(screen.getByText('Custom metadata: gold')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand Bob details' }));

    expect(screen.queryByText('Custom metadata: gold')).not.toBeInTheDocument();
    expect(screen.getByText('Custom metadata: silver')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Alice details' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Collapse Bob details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('supports multiple expanded rows when configured', async () => {
    const user = userEvent.setup();
    renderTable({ config: { ...config, singleRowExpansion: false } });

    await user.click(screen.getByRole('button', { name: 'Expand Alice details' }));
    await user.click(screen.getByRole('button', { name: 'Expand Bob details' }));

    expect(screen.getByText('Custom metadata: gold')).toBeInTheDocument();
    expect(screen.getByText('Custom metadata: silver')).toBeInTheDocument();
  });

  it('supports controlled expanded keys for an external expand-all control', async () => {
    const user = userEvent.setup();
    const onExpandedRowKeysChange = vi.fn();
    renderTable({ expandedRowKeys: ['1'], onExpandedRowKeysChange });

    expect(screen.getByRole('region', { name: 'Collapse Alice details' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand Bob details' }));

    expect(onExpandedRowKeysChange).toHaveBeenCalledWith(['2']);
  });

  it('notifies an uncontrolled expansion change once in StrictMode', async () => {
    const user = userEvent.setup();
    const onExpandedRowKeysChange = vi.fn();

    render(
      <StrictMode>
        <GenericDataTable<TestRow>
          rows={rows}
          config={config}
          totalRecords={22}
          page={1}
          pageSize={10}
          labels={labels}
          onExpandedRowKeysChange={onExpandedRowKeysChange}
          onPageChange={vi.fn()}
          onSortChange={vi.fn()}
        />
      </StrictMode>,
    );

    await user.click(screen.getByRole('button', { name: 'Expand Alice details' }));

    expect(onExpandedRowKeysChange).toHaveBeenCalledTimes(1);
    expect(onExpandedRowKeysChange).toHaveBeenCalledWith(['1']);
  });

  it('maps PrimeReact pagination and sorting events to the controlled server contract', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onSortChange = vi.fn();
    renderTable({ onPageChange, onSortChange });

    await user.click(screen.getByRole('columnheader', { name: /customer name/i }));
    expect(onSortChange).toHaveBeenCalledWith({ field: 'displayName', order: 'asc' });

    await user.click(screen.getByRole('button', { name: 'Next customer page' }));
    expect(onPageChange).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
  });

  it('exposes accessible empty and error states', () => {
    const { rerender, props } = renderTable({ rows: [], totalRecords: 0 });

    expect(screen.getByRole('table', { name: 'Test customers' })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Test customer pagination' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No test customers');

    rerender(
      <GenericDataTable<TestRow> {...props} rows={[]} totalRecords={0} error="Request failed" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
    expect(screen.queryByText('No test customers')).not.toBeInTheDocument();
  });

  it('announces loading, marks the table busy, and keeps row actions touch friendly', () => {
    renderTable({ loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading test customers');
    expect(screen.getByRole('table', { name: 'Test customers' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Expand Alice details' })).toHaveClass(
      'min-h-11',
      'min-w-11',
    );
    expect(screen.queryByText('No test customers')).not.toBeInTheDocument();
  });

  it('merges conflicting caller classes with the caller overrides taking precedence', () => {
    const { container } = renderTable({
      className: 'min-w-full overflow-visible custom-root',
    });
    const root = container.firstElementChild;

    expect(root).toHaveClass('min-w-full', 'overflow-visible', 'custom-root');
    expect(root).not.toHaveClass('min-w-0', 'overflow-hidden');
  });
});
