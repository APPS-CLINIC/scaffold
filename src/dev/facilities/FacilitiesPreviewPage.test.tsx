import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { mockOverlayLayout } from '@/test/overlayLayout';
import { renderWithProviders } from '@/test/renderWithProviders';
import { FacilitiesPreviewPage } from './FacilitiesPreviewPage';

const appendToHead = document.head.appendChild.bind(document.head);
beforeEach(async () => {
  await i18n.changeLanguage('en');
  mockOverlayLayout();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
});

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Preview URL">{location.pathname + location.search}</output>;
}

describe('Facilities development preview', () => {
  it('opens an example facility by a real link and preserves its query when the dialog closes', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <UrlStateSync />
        <Routes>
          <Route path="/dev/facilities/:facilityId?" element={<FacilitiesPreviewPage />} />
        </Routes>
        <LocationProbe />
      </>,
      { initialEntries: ['/dev/facilities?q=Target'] },
    );

    const link = screen.getByRole('link', { name: 'F-1006' });
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
