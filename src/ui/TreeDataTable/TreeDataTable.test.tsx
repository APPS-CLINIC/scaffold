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
