import { useId } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateRangeFilter, MultiSelectFilter, SelectFilter, TextFilter } from '@/ui';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import { statusOptions } from '../tables/tableFixtures';
import { AsyncAdvisorFilter } from './asyncOptions.fixture';

function FilterExample({
  kind = 'multiple',
  state = 'ready',
  selectionLimit,
}: {
  kind?: 'text' | 'single' | 'multiple' | 'date' | 'async';
  state?: 'ready' | 'loading' | 'error' | 'empty';
  selectionLimit?: number;
}) {
  const id = useId();
  const { query, setQuery } = useListQueryState();
  const props = {
    inputId: id,
    labelId: `${id}-label`,
    param: 'example',
    values: query.filters,
    onChange: (next: Readonly<Record<string, readonly string[]>>) =>
      setQuery({
        filters: Object.fromEntries(
          Object.entries(next).map(([key, values]) => [key, [...values]]),
        ),
      }),
  };
  return (
    <div className="max-w-md space-y-4">
      <label id={`${id}-label`} className="block text-sm">
        Example filter
      </label>
      {kind === 'text' ? (
        <TextFilter {...props} />
      ) : kind === 'single' ? (
        <SelectFilter {...props} options={statusOptions} />
      ) : kind === 'date' ? (
        <DateRangeFilter {...props} />
      ) : kind === 'async' ? (
        <AsyncAdvisorFilter {...props} />
      ) : (
        <MultiSelectFilter
          {...props}
          options={state === 'ready' ? statusOptions : []}
          loading={state === 'loading'}
          failed={state === 'error'}
          selectionLimit={selectionLimit}
        />
      )}
      <output aria-label="Filter values" className="block text-sm">
        {JSON.stringify(query.filters)}
      </output>
    </div>
  );
}
const meta = {
  title: 'Table controls/Filter controls',
  component: FilterExample,
  args: { kind: 'multiple', state: 'ready' },
  parameters: {
    docs: {
      description: {
        component:
          'Shared controls using the same inputId/labelId/param/value contract as the filter dialog. Async option search uses createSearchMultiSelectFilter and a cancellable fixture hook; only selected labels and received option pages are supplied.',
      },
    },
  },
} satisfies Meta<typeof FilterExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MultipleSelection: Story = {};
export const SingleSelection: Story = { args: { kind: 'single' } };
export const Text: Story = { args: { kind: 'text' } };
export const DateRange: Story = { args: { kind: 'date' } };
export const OptionsLoading: Story = { args: { state: 'loading' } };
export const OptionsFailed: Story = { args: { state: 'error' } };
export const NoOptions: Story = { args: { state: 'empty' } };
export const SelectionLimit: Story = { args: { selectionLimit: 1 } };
export const AsyncSearchAndPages: Story = { args: { kind: 'async' } };
