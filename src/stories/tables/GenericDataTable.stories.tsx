import { storyText } from '../storyText';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { GenericTableExample } from './GenericTableExample';

const meta = {
  title: 'Tables/GenericDataTable',
  component: GenericTableExample,
  args: { width: 1200, rowCount: 87, state: 'ready', showToolbar: false },
  argTypes: {
    width: { control: { type: 'range', min: 360, max: 1600, step: 20 } },
    rowCount: { control: { type: 'number', min: 0, max: 10000 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The real GenericDataTable with a URL-driven example owner. Pagination, sort and filters query synthetic data; responsive overflow uses the same configured cells in the row accordion. Local settings are not persisted.',
      },
    },
  },
} satisfies Meta<typeof GenericTableExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithToolbar: Story = { args: { showToolbar: true } };
export const NarrowWithDetails: Story = {
  args: { width: 420 },
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', {
        name: t('customers.table.expandRow', { name: 'Example company 001' }),
      }),
    );
    await expect(canvas.getAllByText('Example group 1').length).toBeGreaterThan(0);
  },
};
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const ErrorAndRetry: Story = {
  args: { state: 'error' },
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: t('customers.loading.tryAgain') }));
    await expect(await canvas.findByRole('link', { name: 'Example company 001' })).toBeVisible();
  },
};
export const AsyncPagination: Story = {
  args: { state: 'async' },
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Example company 001' });
    await userEvent.click(canvas.getByRole('button', { name: t('common.pagination.next') }));
    await waitFor(() =>
      expect(canvas.queryByRole('link', { name: 'Example company 001' })).not.toBeInTheDocument(),
    );
    await expect(await canvas.findByRole('link', { name: 'Example company 011' })).toBeVisible();
  },
};
export const LargeDataset: Story = {
  args: { rowCount: 10000, showToolbar: true },
  parameters: {
    docs: {
      description: {
        story:
          '10,000 synthetic service records, with only one requested page rendered. This is a functional paging example, not a production throughput benchmark.',
      },
    },
  },
};
export const LongContentAndMissingValues: Story = { args: { width: 760, rowCount: 10 } };
export const Polish: Story = { globals: { locale: 'pl' }, args: { showToolbar: true } };
