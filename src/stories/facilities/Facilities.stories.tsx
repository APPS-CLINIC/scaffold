import { storyText } from '../storyText';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { FacilitiesPreviewPage } from '@/dev/facilities/FacilitiesPreviewPage';

function FacilitiesExample() {
  return (
    <Routes>
      <Route path="/dev/facilities/:facilityId?" element={<FacilitiesPreviewPage />} />
    </Routes>
  );
}
const meta = {
  title: 'Tables/Facilities',
  component: FacilitiesExample,
  parameters: {
    route: '/dev/facilities',
    facilitiesScenario: 'default',
    docs: {
      description: {
        component:
          'The same Facilities preview owner and RTK Query endpoints as /dev/facilities. Each story has an isolated store and asynchronous transport. Root DTOs contain hasChildren/childrenCount and no descendants; expansion requests direct-child pages. Groups scope the forest without fetching children. Backend HTTP integration is not implied.',
      },
    },
  },
} satisfies Meta<typeof FacilitiesExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LazyLoading: Story = {
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    const expand = await canvas.findByRole(
      'button',
      { name: t('facilities.expand', { number: 'F-1001' }) },
      { timeout: 5000 },
    );
    await expect(canvas.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
    await userEvent.click(expand);
    await expect(await canvas.findByRole('link', { name: 'F-1002' })).toBeVisible();
    await expect(canvas.queryByRole('link', { name: 'F-1003' })).not.toBeInTheDocument();
  },
};
export const LendingStaysLazy: Story = {
  parameters: { route: '/dev/facilities?group=LENDING' },
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole(
        'button',
        { name: t('facilities.expand', { number: 'F-1001' }) },
        { timeout: 5000 },
      ),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
  },
};
export const SlowResponse: Story = { parameters: { facilitiesScenario: 'slow' } };
export const Empty: Story = { parameters: { facilitiesScenario: 'empty' } };
export const RootErrorAndRetry: Story = {
  parameters: { facilitiesScenario: 'root-error' },
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole(
        'button',
        { name: t('customers.loading.tryAgain') },
        { timeout: 5000 },
      ),
    );
    await expect(await canvas.findByRole('link', { name: 'F-1001' })).toBeVisible();
  },
};
export const BranchErrorAndRetry: Story = {
  parameters: { facilitiesScenario: 'branch-error' },
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole(
        'button',
        { name: t('facilities.expand', { number: 'F-1001' }) },
        { timeout: 5000 },
      ),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: t('facilities.retryChildren') }),
    );
    await expect(await canvas.findByRole('link', { name: 'F-1002' })).toBeVisible();
  },
};
export const DeepSearch: Story = {
  parameters: { route: '/dev/facilities?q=Target' },
  play: async ({ canvasElement, globals }) => {
    void globals;
    await expect(
      await within(canvasElement).findByRole('link', { name: 'F-1006' }, { timeout: 10000 }),
    ).toBeVisible();
  },
};
export const ExpandAllAndCancel: Story = {
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole(
        'switch',
        { name: t('customers.actions.expandAll') },
        { timeout: 5000 },
      ),
    );
    await userEvent.click(canvas.getByRole('button', { name: t('facilities.cancelLoadingAll') }));
    await expect(canvas.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('button', { name: t('facilities.retryChildren') }),
    ).not.toBeInTheDocument();
  },
};
export const ManySiblingsAndRootPages: Story = {
  parameters: {
    facilitiesScenario: 'large',
    docs: {
      description: {
        story:
          '80 roots and 1,000 direct children under F-WIDE-001. Each request returns at most 25 siblings. Inspect child and root continuation independently. This synthetic catalogue demonstrates bounded loading, not production performance.',
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole(
        'button',
        { name: t('facilities.expand', { number: 'F-WIDE-001' }) },
        { timeout: 5000 },
      ),
    );
    await canvas.findByRole('link', { name: 'F-CHILD-0025' });
    await expect(canvas.queryByRole('link', { name: 'F-CHILD-0026' })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: t('facilities.moreChildren') }));
    await expect(await canvas.findByRole('link', { name: 'F-CHILD-0026' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: t('facilities.moreRoots') })).toBeEnabled();
  },
};
export const Euro: Story = { parameters: { route: '/dev/facilities?displayCurrency=EUR' } };
export const Polish: Story = { globals: { locale: 'pl' } };
