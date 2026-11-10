import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react-vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockTableContainerWidth } from '@/test/tableLayout';
import preview from '../../.storybook/preview';
import * as tableStories from './tables/GenericDataTable.stories';
import * as searchStories from './controls/GenericSearch.stories';

const { Default, Loading, Empty } = composeStories(tableStories, preview);
const { RestoredDraft } = composeStories(searchStories, preview);
const appendToHead = document.head.appendChild.bind(document.head);
beforeEach(() => {
  mockTableContainerWidth(1200);
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T =>
    node instanceof HTMLStyleElement ? node : (appendToHead(node) as T),
  );
});

describe('Portable table stories with test-only design-system aliases', () => {
  it('renders the configured current page through the shared decorator', async () => {
    render(<Default />);
    expect(await screen.findByRole('link', { name: 'Example company 001' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Example company 011' })).not.toBeInTheDocument();
  });
  it('renders distinct loading and empty states', () => {
    const view = render(<Loading />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Example company 001' })).not.toBeInTheDocument();
    view.unmount();
    render(<Empty />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
  it('keeps an unapplied restored search separate from the applied query', () => {
    render(<RestoredDraft />);
    expect(screen.getByPlaceholderText('Search the list')).toHaveValue('Unapplied draft');
    expect(screen.getByRole('status', { name: 'Applied search' })).toHaveTextContent('–');
  });
});
