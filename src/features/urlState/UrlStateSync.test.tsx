import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { renderWithProviders } from '@/test/renderWithProviders';
import { UrlStateSync } from './UrlStateSync';
import { routeChanged } from './urlState.slice';

function RouteControls() {
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate('/clients/all/123')}>
        Open client
      </button>
      <button type="button" onClick={() => navigate('/clients/advisors')}>
        Open advisors
      </button>
    </>
  );
}

describe('UrlStateSync route mirror', () => {
  it('dispatches routeChanged for deep and same-section pathname changes', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    renderWithProviders(
      <>
        <UrlStateSync />
        <RouteControls />
      </>,
      { store, initialEntries: ['/clients/all'] },
    );

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        routeChanged({
          pathname: '/clients/all',
          sectionKey: 'clients',
          itemId: 'all-clients',
        }),
      ),
    );

    dispatchSpy.mockClear();
    await user.click(screen.getByRole('button', { name: 'Open client' }));
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        routeChanged({
          pathname: '/clients/all/123',
          sectionKey: 'clients',
          itemId: 'all-clients',
        }),
      ),
    );

    dispatchSpy.mockClear();
    await user.click(screen.getByRole('button', { name: 'Open advisors' }));
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        routeChanged({
          pathname: '/clients/advisors',
          sectionKey: 'clients',
          itemId: 'client-advisors',
        }),
      ),
    );
  });
});
