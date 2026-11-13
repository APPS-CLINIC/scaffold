import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { GenericTableSettings } from '@/ui';
import { createExampleRows } from '../tables/tableFixtures';

function SettingsActionsExample({
  onExport,
  onSettings,
}: {
  onExport: () => void;
  onSettings: () => void;
}) {
  const [keys, setKeys] = useState<readonly string[]>([]);
  return (
    <GenericTableSettings
      dataContent={createExampleRows(3)}
      expandedRowKeys={keys}
      onExpandedRowKeysChange={setKeys}
      handleExport={onExport}
      onOpenSettings={onSettings}
    />
  );
}
const meta = {
  title: 'Table controls/GenericTableSettings',
  component: SettingsActionsExample,
  args: { onExport: fn(), onSettings: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Compatibility adapter for existing flat-table owners. It derives expansion keys from dataContent and delegates the shared action rendering to TableActions.',
      },
    },
  },
} satisfies Meta<typeof SettingsActionsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
