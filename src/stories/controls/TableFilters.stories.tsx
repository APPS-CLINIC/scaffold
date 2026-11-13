import { storyText } from '../storyText';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { TableFilters } from '@/ui';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import { exampleTableConfig } from '../tables/tableFixtures';

function FiltersExample() {
  const { query, setQuery } = useListQueryState();
  return (
    <>
      <TableFilters
        fields={exampleTableConfig.fields}
        values={query.filters}
        onChange={(next) =>
          setQuery({
            filters: Object.fromEntries(
              Object.entries(next).map(([param, values]) => [param, [...values]]),
            ),
          })
        }
      />
      <output aria-label="Applied filters" className="mt-6 block whitespace-pre-wrap text-sm">
        {JSON.stringify(query.filters, null, 2)}
      </output>
    </>
  );
}
const meta = {
  title: 'Table controls/TableFilters',
  component: FiltersExample,
  parameters: {
    docs: {
      description: {
        component:
          'The configured filter dialog, draft, Save/Cancel and applied-filter chips. The owner applies values to the isolated story URL. Changing a draft never changes the applied values before Save.',
      },
    },
  },
} satisfies Meta<typeof FiltersExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NoFilters: Story = {};
export const AppliedFilters: Story = {
  parameters: {
    route:
      '/stories/filters?status=ACTIVE&lendingAdvisor=Example&lendingReviewDate.from=2030-01-01',
  },
};
export const OpenDialog: Story = {
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: t('table.filters.title') }),
    );
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', {
        name: t('table.filters.title'),
      }),
    ).toBeVisible();
  },
};
export const SaveTextFilter: Story = {
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: t('table.filters.title') }));
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole('dialog', { name: t('table.filters.title') }));
    await userEvent.type(
      dialog.getByRole('textbox', { name: t('customers.table.field.fullName') }),
      'Example',
    );
    await userEvent.click(dialog.getByRole('button', { name: t('table.filters.save') }));
    await expect(canvas.getByRole('status', { name: 'Applied filters' })).toHaveTextContent(
      'Example',
    );
  },
};
export const CancelDraft: Story = {
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: t('table.filters.title') }));
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', {
        name: t('table.filters.title'),
      }),
    );
    await userEvent.type(
      dialog.getByRole('textbox', { name: t('customers.table.field.fullName') }),
      'Unapplied',
    );
    await userEvent.click(dialog.getByRole('button', { name: t('table.filters.cancel') }));
    await expect(canvas.getByRole('status', { name: 'Applied filters' })).toHaveTextContent('{}');
  },
};
