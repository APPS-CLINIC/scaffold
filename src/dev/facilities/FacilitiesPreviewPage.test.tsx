import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { FacilitiesPreviewPage } from './FacilitiesPreviewPage';
import type { FacilityRootsResponse } from '@/features/facilities';

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

function renderPreview(path = '/dev/facilities') {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <Routes>
        <Route path="/dev/facilities/:facilityId?" element={<FacilitiesPreviewPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { initialEntries: [path] },
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Facilities development preview', () => {
  it('loads only the requested branch, continues its sibling page and reuses it after collapse', async () => {
    const user = userEvent.setup();
    const { store } = renderPreview();
    await screen.findByRole('link', { name: 'F-1001' });
    expect(screen.queryByRole('link', { name: 'F-1002' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Expand facility F-3001' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand facility F-1001' }));
    await screen.findByRole('link', { name: 'F-1002' });
    expect(screen.queryByRole('link', { name: 'F-1003' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand facility F-1002' }));
    await screen.findByRole('link', { name: 'F-1003' });
    await user.click(screen.getByRole('button', { name: 'Expand facility F-1003' }));
    await screen.findByRole('link', { name: 'F-1004' });
    expect(screen.queryByRole('link', { name: 'F-1007' })).not.toBeInTheDocument();
    const parentRow = screen.getByRole('link', { name: 'F-1003' }).closest('tr') as HTMLElement;
    await user.click(within(parentRow).getByRole('button', { name: 'Load more children' }));
    await screen.findByRole('link', { name: 'F-1007' });
    const requests = Object.values(store.getState().api.queries).map((entry) => entry?.requestId);
    await user.click(screen.getByRole('button', { name: 'Collapse facility F-1001' }));
    await user.click(screen.getByRole('button', { name: 'Expand facility F-1001' }));
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeInTheDocument();
    expect(Object.values(store.getState().api.queries).map((entry) => entry?.requestId)).toEqual(
      requests,
    );
    await user.click(screen.getByLabelText('Customize filters', { selector: 'button' }));
    const dialog = screen.getByRole('dialog', { name: 'Customize filters' });
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Show amounts in' }),
      'EUR',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeInTheDocument();
    const childRow = screen.getByRole('link', { name: 'F-1004' }).closest('tr') as HTMLElement;
    expect(within(childRow).getByText('€100,000.00')).toBeInTheDocument();
    expect(Object.values(store.getState().api.queries).map((entry) => entry?.requestId)).toEqual(
      requests,
    );
  });

  it('fetches all descendant pages only when expand all is requested', async () => {
    const user = userEvent.setup();
    renderPreview();
    await screen.findByRole('link', { name: 'F-1001' });
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    await screen.findByRole('link', { name: 'F-1006' });
    expect(screen.getByRole('link', { name: 'F-1007' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Expand all' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    expect(screen.queryByRole('link', { name: 'F-1006' })).not.toBeInTheDocument();
  });

  it('downloads the actual roots response with child metadata, never the cached expanded tree', async () => {
    const user = userEvent.setup();
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
    await screen.findByRole('link', { name: 'F-1001' });
    await user.click(screen.getByRole('switch', { name: 'Expand all' }));
    await screen.findByRole('link', { name: 'F-1006' });
    await user.click(screen.getByRole('button', { name: 'Download example data (.json)' }));
    const blob = blobs[0];
    expect(blob).toBeDefined();
    if (!blob) throw new Error('Expected a downloaded Blob');
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
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
  it('opens an example facility by a real link and preserves its query when the dialog closes', async () => {
    const user = userEvent.setup();
    renderPreview('/dev/facilities?q=Target');

    const link = await screen.findByRole('link', { name: 'F-1006' });
    expect(link).toHaveAttribute('href', '/dev/facilities/1006?q=Target');
    await user.click(link);
    const dialog = screen.getByRole('dialog', { name: 'Facility F-1006' });
    expect(within(dialog).getByText('Target facility at level six')).toBeInTheDocument();
    expect(within(dialog).getByText('6')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Preview URL' })).toHaveTextContent(
      '/dev/facilities?q=Target',
    );
    expect(screen.getByRole('link', { name: 'F-1006' })).toBeInTheDocument();
  });
});
