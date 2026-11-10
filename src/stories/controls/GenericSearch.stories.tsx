import { storyText } from '../storyText';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within, waitFor } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { GenericSearch } from '@/ui';

function SearchExample({
  initialValue = '',
  initialText,
  autoFocus = false,
  onSearch,
}: {
  initialValue?: string;
  initialText?: string;
  autoFocus?: boolean;
  onSearch: (text: string) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <GenericSearch
        value={value}
        initialText={initialText}
        autoFocus={autoFocus}
        placeholder={t('customers.search.placeholder')}
        onSearch={(text) => {
          setValue(text);
          onSearch(text);
        }}
      />
      <output aria-label="Applied search" className="mt-4 block text-sm">
        {value || '–'}
      </output>
    </>
  );
}
const meta = {
  title: 'Table controls/GenericSearch',
  component: SearchExample,
  args: { initialValue: '', autoFocus: false, onSearch: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Controlled search with a 300 ms debounce and a three-character threshold. Clearing or shortening the input clears the applied query. initialText can restore a cancelled draft without applying it immediately.',
      },
    },
  },
} satisfies Meta<typeof SearchExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Applied: Story = { args: { initialValue: 'Example' } };
export const RestoredDraft: Story = { args: { initialText: 'Unapplied draft' } };
export const AutoFocus: Story = { args: { autoFocus: true } };
export const Debounced: Story = {
  play: async ({ canvasElement, args, globals }) => {
    const t = storyText(globals);
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText(t('customers.search.placeholder')), 'Example');
    await waitFor(() => expect(args.onSearch).toHaveBeenLastCalledWith('Example'));
    await userEvent.clear(canvas.getByPlaceholderText(t('customers.search.placeholder')));
    await waitFor(() => expect(args.onSearch).toHaveBeenLastCalledWith(''));
  },
};
