import { storyText } from '../storyText';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TableActions } from '@/ui';

function ActionsExample({
  count = 3,
  initiallyExpanded = false,
  showExport = true,
  showSettings = true,
  onExport,
  onOpenSettings,
}: {
  count?: number;
  initiallyExpanded?: boolean;
  showExport?: boolean;
  showSettings?: boolean;
  onExport: () => void;
  onOpenSettings: () => void;
}) {
  const keys = Array.from({ length: count }, (_, index) => String(index));
  const [expanded, setExpanded] = useState<readonly string[]>(initiallyExpanded ? keys : []);
  return (
    <TableActions
      expandableKeys={keys}
      expandedKeys={expanded}
      onExpandedKeysChange={setExpanded}
      onExport={showExport ? onExport : undefined}
      onOpenSettings={showSettings ? onOpenSettings : undefined}
    />
  );
}
const meta = {
  title: 'Table controls/TableActions',
  component: ActionsExample,
  args: {
    count: 3,
    initiallyExpanded: false,
    showExport: true,
    showSettings: true,
    onExport: fn(),
    onOpenSettings: fn(),
  },
} satisfies Meta<typeof ActionsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement, args, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('switch', { name: t('customers.actions.expandAll') }));
    await expect(
      canvas.getByRole('switch', { name: t('customers.actions.expandAll') }),
    ).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: t('table.settings.open') }));
    await expect(args.onOpenSettings).toHaveBeenCalled();
  },
};
export const Expanded: Story = { args: { initiallyExpanded: true } };
export const NoExpandableRows: Story = { args: { count: 0 } };
export const ExpansionOnly: Story = { args: { showExport: false, showSettings: false } };
