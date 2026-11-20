import { storyText } from '../storyText';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { DueDateFilter } from '@/ui';
import type { DueDateSelection } from '@/ui';

function DueDateExample({ initialValue = [] }: { initialValue?: DueDateSelection }) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <DueDateFilter value={value} onChange={setValue} />
      <output aria-label="Selected windows" className="mt-4 block text-sm">
        {JSON.stringify(value)}
      </output>
    </>
  );
}
const meta = {
  title: 'Table controls/DueDateFilter',
  component: DueDateExample,
  args: { initialValue: [] },
  parameters: {
    docs: {
      description: {
        component:
          'All is exclusive; date windows can be combined. This component controls due-date selection, independently of Facilities group selection or tree expansion.',
      },
    },
  },
} satisfies Meta<typeof DueDateExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const All: Story = {};
export const CombinedWindows: Story = { args: { initialValue: ['upTo30Days', 'overdue'] } };
export const Overdue: Story = { args: { initialValue: ['overdue'] } };
export const SelectWindow: Story = {
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: t('common.dueDateFilter.overdue') }));
    await expect(canvas.getByRole('status', { name: 'Selected windows' })).toHaveTextContent(
      'overdue',
    );
  },
};
