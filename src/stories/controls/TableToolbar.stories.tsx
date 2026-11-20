import type { Meta, StoryObj } from '@storybook/react-vite';
import { GenericTableExample } from '../tables/GenericTableExample';

const meta = {
  title: 'Table controls/TableToolbar',
  component: GenericTableExample,
  args: { showToolbar: true, rowCount: 12, width: 1200 },
  parameters: {
    docs: {
      description: {
        component:
          'The real filter/search/action slot layout in a working table composition. Apply filters, search, open column settings and expand responsive details. The owner updates the URL; the toolbar only arranges its slots.',
      },
    },
  },
} satisfies Meta<typeof GenericTableExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {};
export const Tablet: Story = { args: { width: 760 } };
export const Mobile: Story = { args: { width: 380 } };
export const WithAppliedFilters: Story = {
  parameters: { route: '/stories/toolbar?status=ACTIVE&lendingAdvisor=Example' },
};
