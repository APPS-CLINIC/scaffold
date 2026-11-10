import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListToolbarSkeleton, LoadingSpinner, SkeletonTable } from '@/ui';

function LoadingExample({
  toolbar = true,
  rows = 5,
  width = 1000,
}: {
  toolbar?: boolean;
  rows?: number;
  width?: number;
}) {
  return (
    <div style={{ width, maxWidth: '100%' }} aria-busy="true">
      <span role="status" className="sr-only">
        Loading example table…
      </span>
      {toolbar ? <ListToolbarSkeleton /> : null}
      <SkeletonTable
        rowCount={rows}
        columns={[{ width: 240 }, { width: 120 }, { width: 160 }, { width: 220 }]}
      />
      <span role="status" aria-label="Loading indicator" className="mt-4 inline-flex">
        <LoadingSpinner size="24" />
      </span>
    </div>
  );
}
const meta = {
  title: 'Table feedback/Loading',
  component: LoadingExample,
  args: { toolbar: true, rows: 5, width: 1000 },
  parameters: {
    docs: {
      description: {
        component:
          'Shared toolbar/table skeletons and spinner, with one accessible loading announcement. GenericDataTable also has a dedicated Loading story for its config-driven header and row placeholders.',
      },
    },
  },
} satisfies Meta<typeof LoadingExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const TableAndToolbar: Story = {};
export const TableOnly: Story = { args: { toolbar: false } };
export const Narrow: Story = { args: { width: 380, rows: 3 } };
