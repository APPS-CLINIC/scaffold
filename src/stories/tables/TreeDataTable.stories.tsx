import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { TreeDataTable } from '@/ui';
import type { GenericDataTableConfig } from '@/ui';

interface Node {
  key: string;
  label: string;
  children: Node[];
  hasChildren: boolean;
}
const forest: Node[] = [
  {
    key: 'root',
    label: 'Example parent',
    hasChildren: true,
    children: [
      {
        key: 'child',
        label: 'Example child',
        hasChildren: true,
        children: [{ key: 'leaf', label: 'Example leaf', hasChildren: false, children: [] }],
      },
    ],
  },
];
const config: GenericDataTableConfig<Node> = {
  dataKey: 'key',
  fields: [
    { field: 'label', labelKey: 'facilities.table.basic', width: 360 },
    { field: 'key', labelKey: 'facilities.table.description', width: 260 },
  ],
};

function TreeExample({
  expanded = false,
  lazy = false,
  loadingMore = false,
  state = 'ready',
}: {
  expanded?: boolean;
  lazy?: boolean;
  loadingMore?: boolean;
  state?: 'ready' | 'loading' | 'empty';
}) {
  const [keys, setKeys] = useState<readonly string[]>(expanded ? ['root', 'child'] : []);
  const [loaded, setLoaded] = useState(!lazy);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <>
      {pending ? (
        <p role="status" className="sr-only">
          Loading children…
        </p>
      ) : null}
      <TreeDataTable<Node>
        nodes={
          state === 'empty'
            ? []
            : loaded
              ? forest
              : forest.map((node) => ({ ...node, children: [] }))
        }
        config={config}
        getKey={(node) => node.key}
        getChildren={(node) => node.children}
        getHasChildren={(node) => node.hasChildren}
        getChildrenLoading={(node) => pending && node.key === 'root'}
        onExpand={() => {
          if (!loaded && !pending) {
            setPending(true);
            timer.current = setTimeout(() => {
              setLoaded(true);
              setPending(false);
            }, 500);
          }
        }}
        expandedKeys={keys}
        onExpandedKeysChange={setKeys}
        loading={state === 'loading'}
        loadingMore={loadingMore}
        loadingLabel="Loading hierarchy…"
        noResults="No rows"
        labels={{
          table: 'Example hierarchy',
          notAvailable: '–',
          expand: (node) => `Expand ${node.label}`,
          collapse: (node) => `Collapse ${node.label}`,
        }}
      />
    </>
  );
}
const meta = {
  title: 'Tables/TreeDataTable',
  component: TreeExample,
  args: { expanded: false, lazy: false, state: 'ready' },
  parameters: {
    docs: {
      description: {
        component:
          'Generic tree seam using shared configured fields and TableCell. Hierarchy expansion is independent of responsive field details. The owner supplies children and hasChildren independently.',
      },
    },
  },
} satisfies Meta<typeof TreeExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Collapsed: Story = {};
export const Expanded: Story = { args: { expanded: true } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const UnloadedBranch: Story = {
  args: { lazy: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Example parent' }));
    await expect(await canvas.findByText('Example child')).toBeVisible();
    await expect(canvas.queryByText('Example leaf')).not.toBeInTheDocument();
  },
};

export const LoadingMoreRoots: Story = { args: { loadingMore: true } };
