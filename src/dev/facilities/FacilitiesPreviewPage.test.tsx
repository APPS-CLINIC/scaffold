import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import { userWithFakeTimers } from '@/test/userWithFakeTimers';
import { chooseDropdownOption } from '@/test/chooseDropdownOption';
import { Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { FacilitiesPreviewPage } from './FacilitiesPreviewPage';
import type { AppStore } from '@/app/store';
import type { FacilityRootsResponse } from '@/features/facilities';
import { FACILITIES_PREVIEW_PATH } from './facilitiesPreview.path';
import { FACILITIES_PREVIEW_DELAY_MS } from './facilitiesPreview.transport';

const appendToHead = document.head.appendChild.bind(document.head);
beforeEach(async () => {
  await i18n.changeLanguage('en');
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
});

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Preview URL">{location.pathname + location.search}</output>;
}

function renderPreview(path = FACILITIES_PREVIEW_PATH) {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <Routes>
        <Route
          path={FACILITIES_PREVIEW_PATH + '/:facilityId?'}
          element={<FacilitiesPreviewPage />}
        />
      </Routes>
      <LocationProbe />
    </>,
    { initialEntries: [path] },
  );
}
async function advance(pages = 2) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(pages * FACILITIES_PREVIEW_DELAY_MS);
  });
}
type User = ReturnType<typeof userWithFakeTimers>;
async function expandFacility(user: User, number: string) {
  await user.click(screen.getByRole('button', { name: 'Expand facility ' + number }));
  await advance();
}
function rowOf(number: string): HTMLElement {
  const row = screen.getByRole('link', { name: number }).closest('tr');
  if (!row) throw new Error('Expected the row of ' + number);
  return row;
}
function requestIds(store: AppStore) {
  return Object.values(store.getState().api.queries).map((entry) => entry?.requestId);
}
/** Opens F-1001 → F-1003 and loads the second child page of F-1003 (F-1007). */
async function openBothChildPagesOfF1003(user: User) {
  await advance();
  await expandFacility(user, 'F-1001');
  await expandFacility(user, 'F-1002');
  await expandFacility(user, 'F-1003');
  await user.click(within(rowOf('F-1003')).getByRole('button', { name: 'Load more children' }));
  await advance();
  expect(screen.getByRole('link', { name: 'F-1007' })).toBeInTheDocument();
}

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Facilities development preview', () => {
  it('uses the generic table pending pattern and keeps the same grid after the response', async () => {
    userWithFakeTimers();
    renderPreview();
    const grid = screen.getByRole('treegrid', { name: 'Facilities' });
    expect(grid).toHaveAttribute('aria-busy', 'true');
    expect(within(grid).getAllByRole('columnheader').length).toBeGreaterThan(0);
    expect(within(grid).getAllByRole('row')).toHaveLength(11);
    expect(screen.queryByRole('group', { name: 'Facility groups' })).not.toBeInTheDocument();
    await advance(1);
    expect(screen.getByRole('treegrid', { name: 'Facilities' })).toBe(grid);
    expect(grid).toHaveAttribute('aria-busy', 'true');
    await advance(1);
    expect(screen.getByRole('treegrid', { name: 'Facilities' })).toBe(grid);
    expect(grid).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('button', { name: 'Expand facility F-1001' })).toBeVisible();
  });
  it('keeps the toolbar during subsequent requests and delays the loading indicator', async () => {
    const user = userWithFakeTimers();
    renderPreview();
    await advance();
    const grid = screen.getByRole('treegrid', { name: 'Facilities' });
    await user.click(screen.getByRole('button', { name: 'Lending (inc. TFS) (8)' }));
    expect(grid).toHaveAttribute('aria-busy', 'false');
    await advance(0.6);
    expect(grid).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'All' })).toBeVisible();
    expect(screen.getByPlaceholderText('Search the list')).toBeVisible();
    expect(screen.getByRole('treegrid', { name: 'Facilities' })).toBe(grid);
    await advance();
    expect(grid).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('button', { name: 'Expand facility F-1001' })).toBeVisible();
  });
  it('keeps All and Lending lazy and requests children only after an explicit expansion', async () => {
    const user = userWithFakeTimers();
    const { store } = renderPreview();
    await advance();

    // Choosing a group loads only roots: no branch opens and no child page is requested.
    await user.click(screen.getByRole('button', { name: 'Lending (inc. TFS) (8)' }));
    await advance(8);
    expect(screen.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand facility F-1001' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(
      Object.values(store.getState().api.queries).filter(
        (request) => request?.endpointName === 'getFacilityPreviewChildren',
      ),
    ).toHaveLength(0);

    // Expanding a row loads its direct children only.
    await expandFacility(user, 'F-1001');
    expect(screen.getByRole('link', { name: 'F-1002' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'F-1003' })).not.toBeInTheDocument();

    // Back on All the tree starts collapsed again and the row can be expanded as before.
    await user.click(screen.getByRole('button', { name: 'All' }));
    await advance();
    expect(screen.getByRole('button', { name: 'Expand facility F-1001' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('link', { name: 'F-2001' })).toBeInTheDocument();
    await expandFacility(user, 'F-1001');
    expect(screen.getByRole('link', { name: 'F-1002' })).toBeInTheDocument();
  });

  it('loads only the direct children of the expanded branch', async () => {
    const user = userWithFakeTimers();
    renderPreview();

    // Before the roots arrive there are no rows and nothing to download.
    expect(screen.queryByRole('link', { name: 'F-1001' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download example data (.json)' })).toBeDisabled();
    await advance();
    expect(screen.getByRole('link', { name: 'F-1001' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Expand facility F-3001' }),
    ).not.toBeInTheDocument();

    // Expanding F-1001 shows a loading row until its first child page arrives.
    await user.click(screen.getByRole('button', { name: 'Expand facility F-1001' }));
    expect(screen.getByText('Loading children…')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
    await advance();

    // Only the direct child is loaded, not the deeper levels.
    expect(screen.getByRole('link', { name: 'F-1002' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'F-1003' })).not.toBeInTheDocument();
  });

  it('loads the next child page without removing the children already shown', async () => {
    const user = userWithFakeTimers();
    renderPreview();
    await advance();

    // Load the first child page of F-1003.
    await expandFacility(user, 'F-1001');
    await expandFacility(user, 'F-1002');
    await expandFacility(user, 'F-1003');
    expect(screen.getByRole('link', { name: 'F-1004' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'F-1007' })).not.toBeInTheDocument();

    // Load the next page: F-1004 stays while the request runs, then F-1007 is added.
    await user.click(within(rowOf('F-1003')).getByRole('button', { name: 'Load more children' }));
    expect(screen.getByRole('link', { name: 'F-1004' })).toBeVisible();
    await advance();
    expect(screen.getByRole('link', { name: 'F-1004' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeVisible();
  });

  it('reuses loaded children after collapse and after a currency change', async () => {
    const user = userWithFakeTimers();
    const { store } = renderPreview();
    await openBothChildPagesOfF1003(user);
    const requests = requestIds(store);

    // Collapse and reopen the branch: its loaded children appear at once, with no request.
    await user.click(screen.getByRole('button', { name: 'Collapse facility F-1001' }));
    await user.click(screen.getByRole('button', { name: 'Expand facility F-1001' }));
    expect(screen.queryByText('Loading children…')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeVisible();
    expect(requestIds(store)).toEqual(requests);

    // Change the display currency: amounts switch to EUR and nothing is requested again.
    await user.click(screen.getByLabelText('Customize filters', { selector: 'button' }));
    const dialog = screen.getByRole('dialog', { name: 'Customize filters' });
    await chooseDropdownOption(
      user,
      within(dialog).getByLabelText('Show amounts in', { selector: 'input' }),
      'EUR',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeVisible();
    expect(within(rowOf('F-1004')).getByText('€100,000.00')).toBeInTheDocument();
    expect(requestIds(store)).toEqual(requests);
  });

  it('reveals search matches from every child page of the matching branches', async () => {
    userWithFakeTimers();
    // F-1001 … F-1007 all match. F-1003 has two child pages: F-1004, then F-1007.
    renderPreview(FACILITIES_PREVIEW_PATH + '?q=F-100');

    // One page per step: the roots, then the child pages along the path.
    for (let page = 0; page < 10; page++) await advance(1);

    expect(screen.getByRole('link', { name: 'F-1006' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'F-1004' })).toBeVisible();
    // F-1007 is on the second child page of F-1003.
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Load more children' })).not.toBeInTheDocument();
  });

  it('fetches all descendant pages only when expand all is requested', async () => {
    const user = userWithFakeTimers();
    renderPreview();
    await advance();
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();

    // Expand all follows every child page down to the deepest level.
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    await advance(8);
    expect(screen.getByRole('link', { name: 'F-1006' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Expand all' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );

    // Switching it off collapses the tree back to the top level.
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    await advance(8);
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();
  });

  it('cancels the current expand-all request without adding children or showing an error', async () => {
    const user = userWithFakeTimers();
    renderPreview();
    await advance();

    // Cancel while the first child page is still loading.
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    expect(screen.getByText('Loading children…')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel expanding' }));
    await advance(8);

    // The cancelled page adds no rows, no error and no loading row.
    expect(screen.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Retry loading children' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Loading children…')).not.toBeInTheDocument();

    // The branch can still be expanded by hand afterwards.
    await expandFacility(user, 'F-1001');
    expect(screen.getByRole('link', { name: 'F-1002' })).toBeInTheDocument();
  });

  it('downloads the actual roots response with child metadata, never the cached expanded tree', async () => {
    const user = userWithFakeTimers();
    const blobs: Blob[] = [];
    class DownloadUrl extends URL {
      static override createObjectURL(blob: Blob) {
        blobs.push(blob);
        return 'blob:example';
      }
      static override revokeObjectURL() {}
    }
    vi.stubGlobal('URL', DownloadUrl);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderPreview();
    await advance();
    await screen.findByRole('link', { name: 'F-1001' });
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    await advance(8);
    await screen.findByRole('link', { name: 'F-1006' });
    await user.click(screen.getByRole('button', { name: 'Download example data (.json)' }));
    const blob = blobs[0];
    expect(blob).toBeDefined();
    if (!blob) throw new Error('Expected a downloaded Blob');
    const reading = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    await advance();
    const text = await reading;
    const response = JSON.parse(text) as FacilityRootsResponse;
    expect(response.parentKey).toBeNull();
    expect(response.nodes).toHaveLength(6);
    expect(response.nodes[0]).toMatchObject({
      key: 'lending-1',
      parentKey: null,
      hasChildren: true,
      childrenCount: 1,
    });
    expect(
      response.nodes.every((node) => !('children' in node) && !('childrenState' in node)),
    ).toBe(true);
    expect(response.nodes.some((node) => node.data.id === '1006')).toBe(false);
  });
  it('loads the pages needed to open the chosen facility level, including level five', async () => {
    const user = userWithFakeTimers();
    renderPreview();
    await advance();
    const levels = await screen.findByRole('group', { name: 'Facility level' });
    const chip = (name: string) => within(levels).getByRole('button', { name });

    // Level five opens every branch above it, so F-1005 shows but its child F-1006 does not.
    await user.click(chip('1, 2, 3, 4, 5'));
    await advance(10);
    expect(screen.getByRole('link', { name: 'F-1005' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();

    // Level six opens the whole tree; the chosen level is not written to the URL.
    await user.click(chip('1, 2, 3, 4, 5, 6'));
    await advance(10);
    expect(screen.getByRole('link', { name: 'F-1006' })).toBeInTheDocument();
    expect(chip('1, 2, 3, 4, 5, 6')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status', { name: 'Preview URL' })).not.toHaveTextContent('maxLevel');
  });
  it('opens an example facility by a real link and preserves its query when the dialog closes', async () => {
    const user = userWithFakeTimers();
    renderPreview(FACILITIES_PREVIEW_PATH + '?q=Target');
    await advance(8);

    const link = await screen.findByRole('link', { name: 'F-1006' });
    expect(link).toHaveAttribute('href', FACILITIES_PREVIEW_PATH + '/1006?q=Target');
    await user.click(link);
    const dialog = screen.getByRole('dialog', { name: 'Facility F-1006' });
    expect(within(dialog).getByText('Target facility at level six')).toBeInTheDocument();
    expect(within(dialog).getByText('6')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Preview URL' })).toHaveTextContent(
      FACILITIES_PREVIEW_PATH + '?q=Target',
    );
    expect(screen.getByRole('link', { name: 'F-1006' })).toBeInTheDocument();
  });
});
