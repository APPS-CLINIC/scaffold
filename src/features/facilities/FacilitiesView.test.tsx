import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { facilityPreviewSnapshot } from '@/dev/facilities/facilities.fixture';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { userWithFakeTimers } from '@/test/userWithFakeTimers';
import { FacilitiesView } from './FacilitiesView';
import type { FacilitiesViewProps } from './FacilitiesView';

const appendToHead = document.head.appendChild.bind(document.head);
beforeEach(async () => {
  await i18n.changeLanguage('en');
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function NavigationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Current URL">{location.pathname + location.search}</output>
      <button onClick={() => navigate(-1)}>Back in history</button>
    </>
  );
}

function renderView(path = '/dev/facilities', extra: Partial<FacilitiesViewProps> = {}) {
  const onOpenRelated = vi.fn();
  const rendered = renderWithProviders(
    <>
      <UrlStateSync />
      <FacilitiesView
        snapshot={facilityPreviewSnapshot}
        getFacilityHref={(facility) => '/dev/facilities/' + facility.id}
        onOpenRelated={onOpenRelated}
        {...extra}
      />
      <NavigationProbe />
    </>,
    { initialEntries: [path] },
  );
  return { ...rendered, onOpenRelated };
}

const url = () => screen.getByRole('status', { name: 'Current URL' }).textContent ?? '';

describe('FacilitiesView', () => {
  it('cancels expand all and ignores its eventual result', async () => {
    const user = userEvent.setup();
    let finish: (keys: readonly string[]) => void = () => undefined;
    const pending = new Promise<readonly string[]>((resolve) => {
      finish = resolve;
    });
    const expandAll = vi.fn((_signal: AbortSignal) => pending);
    renderView('/dev/facilities', { onExpandAll: expandAll });
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    await user.click(screen.getByRole('button', { name: 'Cancel expanding' }));
    expect(expandAll.mock.calls[0]?.[0].aborted).toBe(true);
    await act(async () => {
      finish(['lending-1', 'lending-2', 'lending-3', 'lending-4', 'lending-5']);
      await pending;
    });
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Expand all' })).not.toBeChecked();
  });
  it('expands every level, collapses everything and keeps a level-three root structurally at the top', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderView();
    const independent = screen.getByRole('link', { name: 'F-2001' }).closest('tr');
    expect(independent).toHaveAttribute('aria-level', '1');
    expect(within(independent as HTMLElement).getByLabelText('Business level 3')).toHaveTextContent(
      '3',
    );
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    expect(screen.getByRole('link', { name: 'F-1006' }).closest('tr')).toHaveAttribute(
      'aria-level',
      '6',
    );
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Expand all' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches a collapsed level-six leaf, reveals its path and restores the unfiltered view through browser history', async () => {
    const user = userWithFakeTimers();
    renderView();
    await user.type(screen.getByPlaceholderText('Search the list'), 'Target');
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(url()).toContain('q=Target');
    expect(screen.getByRole('link', { name: 'F-1006' })).toBeInTheDocument();
    expect(screen.getAllByText('Parent shown for context')).toHaveLength(5);
    expect(screen.queryByRole('link', { name: 'F-2001' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'TFS (1)' }));
    expect(screen.getByText('No facilities match the selected criteria.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back in history' }));
    expect(screen.getByRole('link', { name: 'F-1006' })).toBeInTheDocument();
  });

  it('applies quick groups to the URL, keeps unrelated params and uses group summaries once', async () => {
    const user = userEvent.setup();
    renderView('/dev/facilities?utm_source=review');
    await user.click(screen.getByRole('button', { name: 'Lending (inc. TFS) (8)' }));
    expect(url()).toContain('group=LENDING');
    expect(url()).toContain('utm_source=review');
    const summary = screen.getByRole('region', { name: 'Summary of selected groups' });
    expect(within(summary).getByText('€200,000.00')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'F-2001' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(url()).not.toContain('group=');
    expect(screen.getByRole('link', { name: 'F-2001' })).toBeInTheDocument();
  });

  it('cancels a filter draft and then saves the level cap, currency and commitment together', async () => {
    const user = userEvent.setup();
    renderView('/dev/facilities?utm_source=review');
    const open = () => screen.getByLabelText('Customize filters', { selector: 'button' });
    await user.click(open());
    let dialog = screen.getByRole('dialog', { name: 'Customize filters' });
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Facility' }), '2');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(url()).not.toContain('maxLevel');
    await user.click(open());
    dialog = screen.getByRole('dialog', { name: 'Customize filters' });
    expect(within(dialog).getByRole('combobox', { name: 'Facility' })).toHaveValue('');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Facility' }), '2');
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Show amounts in' }),
      'EUR',
    );
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'C/U' }), 'U');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(url()).toContain('maxLevel=2');
    expect(url()).toContain('displayCurrency=EUR');
    expect(url()).toContain('commitment=U');
    expect(url()).toContain('utm_source=review');
    expect(screen.getByRole('link', { name: 'F-5001' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'F-1001' })).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Expand all' })).toBeDisabled();
  });

  it('retains expanded branches when only the display currency changes', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    await user.click(screen.getByLabelText('Customize filters', { selector: 'button' }));
    const dialog = screen.getByRole('dialog', { name: 'Customize filters' });
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Show amounts in' }),
      'EUR',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('link', { name: 'F-1006' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Expand all' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const row = screen.getByRole('link', { name: 'F-1006' }).closest('tr');
    expect(within(row as HTMLElement).getByText('€100,000.00')).toBeInTheDocument();
  });

  it('keeps all icon slots, explains inactive actions and opens related data from an active panel', async () => {
    const user = userEvent.setup();
    const { onOpenRelated } = renderView();
    const row = screen.getByRole('link', { name: 'F-3001' }).closest('tr') as HTMLElement;
    expect(within(row).getAllByRole('button')).toHaveLength(7);
    await user.click(
      within(row).getByRole('button', { name: 'Credit accounts — facility F-3001' }),
    );
    let panel = screen.getByRole('dialog', { name: 'Credit accounts — facility F-3001' });
    expect(within(panel).getByText('No data available for this facility')).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: 'Show details' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(within(row).getByRole('button', { name: 'Currencies — facility F-3001' }));
    panel = await screen.findByRole('dialog', { name: 'Currencies — facility F-3001' });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(12);
    await user.click(within(panel).getByRole('button', { name: 'Show details' }));
    expect(onOpenRelated).toHaveBeenCalledWith(
      expect.objectContaining({ id: '3001' }),
      'currencies',
    );
    await waitFor(() => expect(within(row).getByText('9+')).toBeInTheDocument());
  });
});
