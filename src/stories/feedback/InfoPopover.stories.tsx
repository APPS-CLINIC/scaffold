import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { InfoPopover, PrimeIcon } from '@/ui';

function PopoverExample({
  muted = false,
  longContent = false,
  onDetails,
}: {
  muted?: boolean;
  longContent?: boolean;
  onDetails: () => void;
}) {
  return (
    <div className="flex min-h-60 items-center justify-center">
      <InfoPopover
        label="Example facility information"
        muted={muted}
        trigger={<PrimeIcon name="eye" />}
      >
        <p className="mt-0">
          {muted
            ? 'No data available for this example.'
            : 'Information belonging to the selected facility.'}
        </p>
        {longContent ? (
          <ul>
            {Array.from({ length: 8 }, (_, index) => (
              <li key={index}>Example entry {index + 1}</li>
            ))}
          </ul>
        ) : null}
        {!muted ? (
          <button type="button" className="text-[var(--accent)] underline" onClick={onDetails}>
            Example details
          </button>
        ) : null}
      </InfoPopover>
    </div>
  );
}
const meta = {
  title: 'Table feedback/InfoPopover',
  component: PopoverExample,
  args: { muted: false, longContent: false, onDetails: fn() },
  parameters: {
    docs: {
      story: { inline: false },
      description: {
        component:
          'The real IWA Popover adapter: hover/focus, click to pin, interactive content, Escape to close and restore trigger focus. Verify positioning near viewport edges with the real design-system package.',
      },
    },
  },
} satisfies Meta<typeof PopoverExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NoData: Story = { args: { muted: true } };
export const LongerContent: Story = { args: { longContent: true } };
export const KeyboardAndEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Example facility information' });
    await userEvent.click(trigger);
    await expect(
      await body.findByRole('dialog', { name: 'Example facility information' }),
    ).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
    await expect(
      body.queryByRole('dialog', { name: 'Example facility information' }),
    ).not.toBeInTheDocument();
  },
};
