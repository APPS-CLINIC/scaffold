import { createRef, useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TreeDataTable } from './TreeDataTable';
import { getExpandableTreeKeys } from './treeKeys';
import i18n from '@/i18n';
import type { GenericDataTableConfig, GenericDataTableCellProps } from '@/ui';

interface Node {
  key: string;
  label: string;
  children: Node[];
}
const tree: Node[] = [
  {
    key: 'root',
    label: 'Root',
    children: [
      { key: 'child', label: 'Child', children: [{ key: 'leaf', label: 'Leaf', children: [] }] },
    ],
  },
];
const getKey = (node: Node) => node.key;
const getChildren = (node: Node) => node.children;
function DetailsCell({ row }: GenericDataTableCellProps<Node, 'key'>) {
  return 'Details of ' + row.label;
}
const config = {
  dataKey: 'key',
  fields: [
    { field: 'label', labelKey: 'facilities.table.basic', width: 180 },
    { field: 'key', labelKey: 'facilities.table.description', width: 180, component: DetailsCell },
  ],
} satisfies GenericDataTableConfig<Node>;
const labels = {
  table: 'Example hierarchy',
  expand: (node: Node) => 'Expand ' + node.label,
  collapse: (node: Node) => 'Collapse ' + node.label,
  notAvailable: '–',
};
const appendToHead = document.head.appendChild.bind(document.head);

beforeEach(async () => {
  await i18n.changeLanguage('en');
  vi.spyOn(document.head, 'appendChild').mockImplementation(
    <T extends globalThis.Node>(node: T): T => {
      if (node instanceof HTMLStyleElement) return node;
      return appendToHead(node) as T;
    },
  );
});

function ControlledTable() {
  const [keys, setKeys] = useState<readonly string[]>([]);
  return (
    <TreeDataTable
      nodes={tree}
      getKey={getKey}
      getChildren={getChildren}
      config={config}
      expandedKeys={keys}
      onExpandedKeysChange={setKeys}
      labels={labels}
      noResults="No rows"
    />
  );
}

describe('TreeDataTable', () => {
  it('keeps its headers and grid mounted while shared skeleton rows replace real data', () => {
    const props = {
      nodes: tree,
      getKey,
      getChildren,
      config,
      expandedKeys: [],
      onExpandedKeysChange: vi.fn(),
      labels,
      noResults: 'Nothing matches',
    };
    const view = render(<TreeDataTable {...props} />);
    const grid = screen.getByRole('treegrid', { name: labels.table });
    view.rerender(<TreeDataTable {...props} loading loadingLabel="Loading hierarchy" />);
    expect(screen.getByRole('treegrid', { name: labels.table })).toBe(grid);
    expect(screen.getAllByRole('columnheader')).toHaveLength(config.fields.length);
    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(screen.queryByText('Root', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand Root' })).not.toBeInTheDocument();
    expect(screen.queryByText('Nothing matches')).not.toBeInTheDocument();
    view.rerender(<TreeDataTable {...props} />);
    expect(screen.getByRole('treegrid', { name: labels.table })).toBe(grid);
    expect(screen.getByText('Root', { exact: true })).toBeInTheDocument();
  });
  it('adds a pending child row while retaining already loaded siblings', () => {
    const props = {
      nodes: tree,
      getKey,
      getChildren,
      config,
      expandedKeys: ['root'],
      onExpandedKeysChange: vi.fn(),
      labels,
      noResults: 'Nothing matches',
    };
    const view = render(<TreeDataTable {...props} />);
    const child = screen.getByText('Child', { exact: true }).closest('tr');
    const count = screen.getAllByRole('row').length;
    view.rerender(<TreeDataTable {...props} getChildrenLoading={(node) => node.key === 'root'} />);
    expect(screen.getByText('Child', { exact: true }).closest('tr')).toBe(child);
    expect(screen.getAllByRole('row')).toHaveLength(count + 1);
    view.rerender(<TreeDataTable {...props} />);
    expect(screen.getAllByRole('row')).toHaveLength(count);
  });
  it('keeps received roots visible while another root page is pending', () => {
    render(
      <TreeDataTable
        nodes={tree}
        getKey={getKey}
        getChildren={getChildren}
        config={config}
        expandedKeys={[]}
        onExpandedKeysChange={vi.fn()}
        labels={labels}
        noResults="Nothing matches"
        loadingMore
        loadingLabel="Loading another root page"
      />,
    );
    expect(screen.getByText('Root', { exact: true })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('Loading another root page');
  });
  it('keeps an unloaded branch expandable using metadata rather than its empty child array', async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    const nodes: Node[] = [{ key: 'root', label: 'Root', children: [] }];
    render(
      <TreeDataTable
        nodes={nodes}
        getKey={getKey}
        getChildren={getChildren}
        getHasChildren={(node) => node.key === 'root'}
        config={config}
        expandedKeys={[]}
        onExpandedKeysChange={vi.fn()}
        onExpand={onExpand}
        labels={labels}
        noResults="No rows"
      />,
    );
    const toggle = screen.getByRole('button', { name: 'Expand Root' });
    expect(toggle).toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(onExpand).toHaveBeenCalledWith(nodes[0]);
    expect(getExpandableTreeKeys(nodes, getKey, getChildren, () => true)).toEqual(['root']);
  });
  it('shows descendants as rows of the same grid and preserves controlled expansion through collapse', async () => {
    const user = userEvent.setup();
    render(<ControlledTable />);
    expect(screen.queryByText('Child', { exact: true })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand Root' }));
    await user.click(screen.getByRole('button', { name: 'Expand Child' }));
    const row = screen.getByText('Leaf', { exact: true }).closest('tr');
    expect(row).toHaveAttribute('aria-level', '3');
    expect(within(row as HTMLElement).getByText('Details of Leaf')).toBeInTheDocument();
    expect(screen.getAllByRole('treegrid')).toHaveLength(1);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Collapse Root' }));
    expect(screen.queryByText('Leaf', { exact: true })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand Root' }));
    expect(screen.getByText('Leaf', { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand Leaf' })).not.toBeInTheDocument();
  });

  it('aligns every depth and draws bracket guides from each open parent to its last descendant', async () => {
    const user = userEvent.setup();
    const branches: Node[] = [
      {
        key: 'root',
        label: 'Root',
        children: [
          {
            key: 'a',
            label: 'A',
            children: [
              { key: 'a1', label: 'A1', children: [] },
              { key: 'a2', label: 'A2', children: [] },
            ],
          },
          { key: 'b', label: 'B', children: [] },
        ],
      },
      { key: 'other', label: 'Other', children: [] },
    ];
    function Table() {
      const [keys, setKeys] = useState<readonly string[]>([]);
      return (
        <TreeDataTable
          nodes={branches}
          getKey={getKey}
          getChildren={getChildren}
          config={config}
          expandedKeys={keys}
          onExpandedKeysChange={setKeys}
          labels={labels}
          noResults="No rows"
        />
      );
    }
    render(<Table />);
    const rowOf = (label: string) =>
      screen.getByText(label, { exact: true }).closest('tr') as HTMLElement;
    const guides = (label: string) =>
      [...rowOf(label).querySelectorAll('[data-guide]')].map(
        (guide) => guide.getAttribute('data-guide') + ':' + guide.getAttribute('data-guide-depth'),
      );
    const expandRoot = screen.getByRole('button', { name: 'Expand Root' });
    expect(guides('Root')).toEqual([]);
    expect(expandRoot).toHaveClass('text-[var(--navigation-accent)]');
    await user.click(expandRoot);
    await user.click(screen.getByRole('button', { name: 'Expand A' }));
    expect(screen.getByRole('button', { name: 'Collapse Root' })).toHaveClass('text-[var(--text)]');
    expect(guides('Root')).toEqual(['open:0']);
    expect(guides('A')).toEqual(['through:0', 'open:1']);
    expect(guides('A1')).toEqual(['through:0', 'through:1']);
    expect(guides('A2')).toEqual(['through:0', 'close:1']);
    expect(guides('B')).toEqual(['close:0']);
    expect(guides('Other')).toEqual([]);
    // A bracket spans from the top of the parent row to the bottom of its last descendant row.
    const strokes = (label: string, kind: string) =>
      [...(rowOf(label).querySelector(`[data-guide="${kind}"]`)?.children ?? [])].map(
        (stroke) => (stroke as HTMLElement).style,
      );
    const [openLine, openArm] = strokes('Root', 'open');
    expect([openLine?.top, openLine?.bottom, openArm?.top]).toEqual(['6px', '0px', '6px']);
    const [closeLine, closeArm] = strokes('A2', 'close');
    expect([closeLine?.top, closeLine?.bottom, closeArm?.bottom]).toEqual(['0px', '6px', '6px']);
    expect(closeArm?.top).toBe('');
    for (const label of ['Root', 'A', 'A1', 'B']) {
      const firstCell = within(rowOf(label)).getAllByRole('gridcell')[0] as HTMLElement;
      expect(firstCell).toHaveClass('relative', '!pl-9');
      expect(firstCell.querySelector('[style*="margin"]')).toBeNull();
      expect(firstCell.querySelector('[aria-hidden="true"] [data-guide]') ?? null).toBe(
        firstCell.querySelector('[data-guide]'),
      );
    }
    expect(rowOf('A1')).toHaveAttribute('aria-level', '3');
    await user.click(screen.getByRole('button', { name: 'Collapse A' }));
    expect(guides('A')).toEqual(['through:0']);
    expect(guides('B')).toEqual(['close:0']);
  });

  it('closes the parent bracket on a pending child placeholder', () => {
    render(
      <TreeDataTable
        nodes={tree}
        getKey={getKey}
        getChildren={getChildren}
        getChildrenLoading={(node) => node.key === 'root'}
        config={config}
        expandedKeys={['root']}
        onExpandedKeysChange={vi.fn()}
        labels={labels}
        noResults="No rows"
      />,
    );
    const rows = screen.getAllByRole('row').slice(1);
    const placeholder = rows.at(-1) as HTMLElement;
    expect(screen.getByText('Child', { exact: true }).closest('tr')).not.toBe(placeholder);
    expect(
      [...placeholder.querySelectorAll('[data-guide]')].map((guide) =>
        guide.getAttribute('data-guide'),
      ),
    ).toEqual(['close']);
  });

  it('applies field header and cell classes after the table defaults', () => {
    const shaded = {
      dataKey: 'key',
      fields: [
        {
          field: 'label',
          labelKey: 'facilities.table.basic',
          width: 180,
          headerClassName: '!bg-[var(--table-key-column)]',
          cellClassName: 'bg-[var(--table-key-column)]',
        },
        { field: 'key', labelKey: 'facilities.table.description', width: 180 },
      ],
    } satisfies GenericDataTableConfig<Node>;
    render(
      <TreeDataTable
        nodes={tree}
        getKey={getKey}
        getChildren={getChildren}
        config={shaded}
        expandedKeys={[]}
        onExpandedKeysChange={vi.fn()}
        labels={labels}
        noResults="No rows"
      />,
    );
    const [first, second] = screen.getAllByRole('columnheader');
    expect(first).toHaveClass('px-3', '!bg-[var(--table-key-column)]');
    expect(second).not.toHaveClass('!bg-[var(--table-key-column)]');
    const [cell, plainCell] = screen.getAllByRole('gridcell');
    expect(cell).toHaveClass('px-3', 'bg-[var(--table-key-column)]');
    expect(plainCell).not.toHaveClass('bg-[var(--table-key-column)]');
  });

  it('opens a focused row with the keyboard and gives its custom toggle an accessible name', async () => {
    const user = userEvent.setup();
    render(<ControlledTable />);
    const row = screen.getByText('Root', { exact: true }).closest('tr');
    (row as HTMLElement).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Collapse Root' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Child', { exact: true })).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByText('Child', { exact: true })).not.toBeInTheDocument();
  });

  it('forwards the root ref and caller classes, announces loading and empty results separately', () => {
    const ref = createRef<HTMLDivElement>();
    const props = {
      nodes: [] as Node[],
      config,
      getKey,
      getChildren,
      expandedKeys: [],
      onExpandedKeysChange: vi.fn(),
      labels,
      noResults: 'Nothing matches',
    };
    const { rerender } = render(
      <TreeDataTable {...props} ref={ref} className="min-w-full custom-tree" />,
    );
    expect(ref.current).toHaveClass('min-w-full', 'custom-tree');
    expect(ref.current).not.toHaveClass('min-w-0');
    expect(screen.getByRole('status')).toHaveTextContent('Nothing matches');
    rerender(<TreeDataTable {...props} loading loadingLabel="Loading hierarchy" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading hierarchy');
    expect(screen.getByRole('treegrid', { name: labels.table })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByText('Nothing matches')).not.toBeInTheDocument();
  });

  it('collects branches recursively and excludes leaves from the expand-all keys', () => {
    expect(getExpandableTreeKeys(tree, getKey, getChildren)).toEqual(['root', 'child']);
    expect(getExpandableTreeKeys([], getKey, getChildren)).toEqual([]);
  });
});
