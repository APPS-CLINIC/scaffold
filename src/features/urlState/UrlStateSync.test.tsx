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
      <button type="button" onClick={() => navigate('/customers/all/123')}>
        Open customer
      </button>
      <button type="button" onClick={() => navigate('/portfolio/reviews')}>
        Open reviews
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
      { store, initialEntries: ['/customers/all'] },
    );

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        routeChanged({
          pathname: '/customers/all',
          sectionKey: 'customers',
          itemId: 'all-customers',
        }),
      ),
    );

    dispatchSpy.mockClear();
    await user.click(screen.getByRole('button', { name: 'Open customer' }));
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        routeChanged({
          pathname: '/customers/all/123',
          sectionKey: 'customers',
          itemId: null,
        }),
      ),
    );

    dispatchSpy.mockClear();
    await user.click(screen.getByRole('button', { name: 'Open reviews' }));
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        routeChanged({
          pathname: '/portfolio/reviews',
          sectionKey: 'portfolio',
          itemId: 'reviews',
        }),
      ),
    );
  });
});
