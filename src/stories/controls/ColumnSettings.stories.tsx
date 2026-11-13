import { storyText } from '../storyText';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { Button, TableColumnSettingsDialog } from '@/ui';
import type { GenericDataTableField } from '@/ui';
import type { ExampleRow } from '../tables/tableFixtures';
import { exampleTableConfig } from '../tables/tableFixtures';

function SettingsExample({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(initiallyOpen);
  const [columns, setColumns] = useState<readonly GenericDataTableField<ExampleRow>[]>([
    'fullName',
    'status',
    'lendingReviewDate',
  ]);
  return (
    <>
      <Button label={t('table.settings.open')} onClick={() => setOpen(true)} />
      <output aria-label="Saved columns" className="mt-4 block text-sm">
        {columns.join(', ')}
      </output>
      <TableColumnSettingsDialog
        open={open}
        fields={exampleTableConfig.fields}
        columns={columns}
        onSave={(next) => {
          setColumns(next);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
        onRestoreDefaults={() => {
          setColumns(exampleTableConfig.fields.map((field) => field.field));
          setOpen(false);
        }}
      />
    </>
  );
}
const meta = {
  title: 'Table controls/Column settings',
  component: SettingsExample,
  args: { initiallyOpen: false },
  parameters: {
    docs: {
      story: { inline: false, height: '900px' },
      description: {
        component:
          'Generic column selection and ordering with the real dialog, validation and dnd-kit pointer/keyboard reordering. Save updates the owner; Cancel discards its draft. These story settings are not written to localStorage.',
      },
    },
  },
} satisfies Meta<typeof SettingsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const OpenDialog: Story = { args: { initiallyOpen: true } };
export const SaveAndReopen: Story = {
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: t('table.settings.title') }));
    const dialog = within(await body.findByRole('dialog', { name: t('table.settings.title') }));
    await userEvent.click(dialog.getByRole('button', { name: t('table.settings.save') }));
    await expect(canvas.getByRole('status', { name: 'Saved columns' })).toHaveTextContent(
      'fullName, status, lendingReviewDate',
    );
    await userEvent.click(canvas.getByRole('button', { name: t('table.settings.title') }));
    await expect(
      await body.findByRole('dialog', { name: t('table.settings.title') }),
    ).toBeVisible();
  },
};
