import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';

import {
  mockTableContainerWidth,
  paginatorControl,
  resizeTableContainer,
} from '@/test/tableLayout';
import {
  GenericDataTable,
  resolveColumnFields,
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

/**
 * Widths sum to 600. At WIDE_CONTAINER everything fits as columns; at
 * NARROW_CONTAINER the budget is 400 - 44 (expander) - 160 (pinned name)
 * = 196, so `status` (120) fits and `note`/`metadata` drop to the accordion.
 */
const WIDE_CONTAINER = 800;
const NARROW_CONTAINER = 400;

const config = {
  dataKey: 'id',
  fields: [
    {
      field: 'name',
      labelKey: 'customers.table.field.fullName',
      component: NameCell,
      width: 160,
      alwaysVisible: true,
      sortable: true,
      sortField: 'displayName',
    },
    {
      field: 'status',
      labelKey: 'customers.table.field.status',
      component: StatusCell,
      width: 120,
      sortable: true,
    },
    {
      field: 'note',
      labelKey: 'customers.table.field.kkf',
      width: 140,
    },
    {
      field: 'metadata',
      labelKey: 'customers.table.field.internalGroupName',
      component: MetadataCell,
      width: 180,
    },
  ],
} as const satisfies GenericDataTableConfig<TestRow>;

const labels = {
  table: 'Test customers',
  loading: 'Loading test customers',
  empty: 'No test customers',
  pagination: 'Test customer pagination',
  notAvailable: 'Not available',
  detailsColumn: 'Row details',
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
  it('shows every configured field as a column when the container is wide enough', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    renderTable();

    expect(screen.getByRole('columnheader', { name: /customer name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'KKF' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /internal group name/i })).toBeInTheDocument();
    expect(screen.getByText('Alice:name:0')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Custom metadata: gold')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-10 of 22')).toBeInTheDocument();

    // Everything fits, so there is nothing to expand.
    expect(screen.queryByRole('button', { name: 'Expand Alice details' })).not.toBeInTheDocument();
    // The unconfigured field never renders anywhere.
    expect(screen.queryByText('alice-classified')).not.toBeInTheDocument();
  });

  it('moves fields that do not fit into the accordion and keeps column order', async () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByRole('columnheader', { name: /customer name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'KKF' })).not.toBeInTheDocument();
    expect(screen.queryByText('Custom metadata: gold')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand Alice details' }));

    const details = screen.getByRole('region', { name: 'Collapse Alice details' });
    expect(within(details).getByText('KKF')).toBeInTheDocument();
    expect(within(details).getByText('Not available')).toBeInTheDocument();
    expect(within(details).getByText('Custom metadata: gold')).toBeInTheDocument();
    expect(screen.queryByText('alice-classified')).not.toBeInTheDocument();
    expect(screen.queryByText('bob-classified')).not.toBeInTheDocument();
  });

  it('re-splits the columns when the container is resized', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'KKF' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand Alice details' })).not.toBeInTheDocument();

    resizeTableContainer(NARROW_CONTAINER);

    expect(screen.queryByRole('columnheader', { name: 'KKF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Alice details' })).toBeInTheDocument();
  });

  it('renders columns in the order of the resolved fields', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    renderTable({
      config: {
        ...config,
        fields: resolveColumnFields(config.fields, ['status', 'name', 'note', 'metadata']),
      },
    });

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(headers[0]).toMatch(/status/i);
    expect(headers[1]).toMatch(/customer name/i);
  });

  it('asks the owner to clear sorting once when the sorted column drops into the accordion', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const onSortClear = vi.fn();
    renderTable({ sortField: 'note', sortOrder: 'asc', onSortClear });

    expect(onSortClear).not.toHaveBeenCalled();

    resizeTableContainer(NARROW_CONTAINER);
    expect(onSortClear).toHaveBeenCalledTimes(1);

    // Further layout changes must not re-fire while the same sort stays hidden.
    resizeTableContainer(NARROW_CONTAINER - 10);
    expect(onSortClear).toHaveBeenCalledTimes(1);
  });

  it('clears a re-applied sort that returns while its column is still hidden', () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    const onSortClear = vi.fn();
    const { props, rerender } = renderTable({ sortField: 'note', sortOrder: 'asc', onSortClear });

    expect(onSortClear).toHaveBeenCalledTimes(1);

    // The owner honors the clear (sort removed), then the user restores the
    // same sort via browser back / deep link while the column is still hidden.
    rerender(<GenericDataTable<TestRow> {...props} sortField={undefined} sortOrder={undefined} />);
    rerender(<GenericDataTable<TestRow> {...props} sortField="note" sortOrder="asc" />);

    expect(onSortClear).toHaveBeenCalledTimes(2);
  });

  it('drops every later optional field once one does not fit, preserving column order', () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    // status is widened past the remaining budget; note (100px) would fit
    // greedily, but must drop with it to keep the configured order intact.
    const cascadeFields = config.fields.map((field) => {
      if (field.field === 'status') return { ...field, width: 200 };
      if (field.field === 'note') return { ...field, width: 100 };
      return field;
    });
    renderTable({ config: { ...config, fields: cascadeFields } });

    expect(screen.getByRole('columnheader', { name: /customer name/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /status/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'KKF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Alice details' })).toBeInTheDocument();
  });

  it('reserves room for the expansion toggle when splitting columns', () => {
    // 440px: name (160, pinned) + status (120) fit, and note (140) fits only
    // if the 44px expander reservation is ignored — it must not.
    mockTableContainerWidth(440);
    renderTable();

    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'KKF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Alice details' })).toBeInTheDocument();
  });

  it('collapses orphaned expansion rows when every field fits again', async () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    const user = userEvent.setup();
    const { container } = renderTable();

    await user.click(screen.getByRole('button', { name: 'Expand Alice details' }));
    expect(container.querySelector('.p-datatable-row-expansion')).not.toBeNull();

    resizeTableContainer(WIDE_CONTAINER);

    expect(container.querySelector('.p-datatable-row-expansion')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /collapse alice details/i }),
    ).not.toBeInTheDocument();
  });

  it('suppresses the vendor empty row during loading and error states', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const { rerender, props } = renderTable({ rows: [], totalRecords: 0, loading: true });

    expect(screen.queryByText('No available options')).not.toBeInTheDocument();

    rerender(
      <GenericDataTable<TestRow>
        {...props}
        rows={[]}
        totalRecords={0}
        loading={false}
        error="Request failed"
      />,
    );

    expect(screen.queryByText('No available options')).not.toBeInTheDocument();
  });

  it('names the expansion column and only references details that exist', async () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Row details' })).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Expand Alice details' });
    expect(toggle).not.toHaveAttribute('aria-controls');

    await user.click(toggle);
    const expandedToggle = screen.getByRole('button', { name: 'Collapse Alice details' });
    expect(expandedToggle).toHaveAttribute('aria-controls');
  });

  it('keeps the sort untouched when the sorted column stays visible', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const onSortClear = vi.fn();
    renderTable({ sortField: 'displayName', sortOrder: 'desc', onSortClear });

    resizeTableContainer(NARROW_CONTAINER);

    // `name` is alwaysVisible, so its sort survives any width.
    expect(onSortClear).not.toHaveBeenCalled();
  });

  it('behaves as a single-row accordion by default', async () => {
    mockTableContainerWidth(NARROW_CONTAINER);
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
    mockTableContainerWidth(NARROW_CONTAINER);
    const user = userEvent.setup();
    renderTable({ config: { ...config, singleRowExpansion: false } });

    await user.click(screen.getByRole('button', { name: 'Expand Alice details' }));
    await user.click(screen.getByRole('button', { name: 'Expand Bob details' }));

    expect(screen.getByText('Custom metadata: gold')).toBeInTheDocument();
    expect(screen.getByText('Custom metadata: silver')).toBeInTheDocument();
  });

  it('supports controlled expanded keys for an external expand-all control', async () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    const user = userEvent.setup();
    const onExpandedRowKeysChange = vi.fn();
    renderTable({ expandedRowKeys: ['1'], onExpandedRowKeysChange });

    expect(screen.getByRole('region', { name: 'Collapse Alice details' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand Bob details' }));

    expect(onExpandedRowKeysChange).toHaveBeenCalledWith(['2']);
  });

  it('notifies an uncontrolled expansion change once in StrictMode', async () => {
    mockTableContainerWidth(NARROW_CONTAINER);
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
    mockTableContainerWidth(WIDE_CONTAINER);
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onSortChange = vi.fn();
    renderTable({ onPageChange, onSortChange });
    const renderedNames = () => screen.getAllByText(/:name:/).map((element) => element.textContent);

    expect(renderedNames()).toEqual(['Alice:name:0', 'Bob:name:1']);

    await user.click(screen.getByRole('columnheader', { name: /customer name/i }));
    expect(onSortChange).toHaveBeenCalledWith({ field: 'displayName', order: 'asc' });
    expect(renderedNames()).toEqual(['Alice:name:0', 'Bob:name:1']);

    await user.click(paginatorControl('next'));
    expect(onPageChange).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
  });

  it('maps the first and last page controls onto the controlled page', async () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderTable({ page: 2, onPageChange });

    await user.click(paginatorControl('first'));
    expect(onPageChange).toHaveBeenCalledWith({ page: 1, pageSize: 10 });

    await user.click(paginatorControl('last'));
    expect(onPageChange).toHaveBeenCalledWith({ page: 3, pageSize: 10 });
  });

  it('exposes accessible empty and error states', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
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

  it('announces loading and marks the table busy', () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    renderTable({ loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading test customers');
    expect(screen.getByRole('table', { name: 'Test customers' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByText('No test customers')).not.toBeInTheDocument();
  });

  it('keeps row actions touch friendly', () => {
    mockTableContainerWidth(NARROW_CONTAINER);
    renderTable();

    expect(screen.getByRole('button', { name: 'Expand Alice details' })).toHaveClass(
      'min-h-11',
      'min-w-11',
    );
  });

  it('renders config-driven headers with skeleton rows while loading, then real rows', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const { rerender, props } = renderTable({ rows: [], totalRecords: 0, loading: true });

    // The real table stays mounted: headers come straight from the config
    // while the body rows are placeholders.
    expect(screen.getByRole('table', { name: 'Test customers' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /customer name/i })).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading test customers');

    rerender(
      <GenericDataTable<TestRow> {...props} rows={rows} totalRecords={22} loading={false} />,
    );

    expect(screen.getByText('Alice:name:0')).toBeInTheDocument();
  });

  it('keeps the previous rows visible and dimmed during a refetch', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const { rerender, props } = renderTable({ loading: false });

    expect(screen.getByText('Alice:name:0')).toBeInTheDocument();

    rerender(<GenericDataTable<TestRow> {...props} loading={true} />);

    // Same table element, no vendor loading mask; the stale rows stay on
    // screen (dimmed) until the response lands.
    expect(screen.getByRole('table', { name: 'Test customers' })).toBeInTheDocument();
    expect(screen.getByText('Alice:name:0')).toBeInTheDocument();
    expect(document.querySelector('.p-datatable-loading-overlay')).toBeNull();
    expect(document.querySelector('tbody tr')?.className).toContain('opacity-60');
  });

  it('keeps the table mounted when loading resumes after an errored first load', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const { rerender, props } = renderTable({
      rows: [],
      totalRecords: 0,
      loading: false,
      error: 'Request failed',
    });

    expect(screen.getByRole('table', { name: 'Test customers' })).toBeInTheDocument();

    rerender(
      <GenericDataTable<TestRow>
        {...props}
        rows={[]}
        totalRecords={0}
        loading={true}
        error={undefined}
      />,
    );

    expect(screen.getByRole('table', { name: 'Test customers' })).toBeInTheDocument();
  });

  it('merges conflicting caller classes with the caller overrides taking precedence', () => {
    mockTableContainerWidth(WIDE_CONTAINER);
    const { container } = renderTable({
      className: 'min-w-full overflow-visible custom-root',
    });
    const root = container.firstElementChild;

    expect(root).toHaveClass('min-w-full', 'overflow-visible', 'custom-root');
    expect(root).not.toHaveClass('min-w-0', 'overflow-hidden');
  });
});
