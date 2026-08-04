import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useListQueryState } from './useListQueryState';

function QueryControls() {
  const { setQuery } = useListQueryState();

  return (
    <>
      <button type="button" onClick={() => setQuery({ filters: { status: 'active' } })}>
        Show active
      </button>
      <button type="button" onClick={() => setQuery({ page: 4 })}>
        Open page four
      </button>
    </>
  );
}

function LocationProbe() {
  const { search } = useLocation();
  return <output aria-label="Current search parameters">{search}</output>;
}

describe('useListQueryState', () => {
  it('writes filters to the URL and resets pagination', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <QueryControls />
        <LocationProbe />
      </>,
      { initialEntries: ['/clients/all?page=3'] },
    );

    await user.click(screen.getByRole('button', { name: 'Show active' }));

    expect(screen.getByRole('status', { name: 'Current search parameters' })).toHaveTextContent(
      '?filter.status=active',
    );
  });

  it('keeps explicit page changes in URL state', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <QueryControls />
        <LocationProbe />
      </>,
      { initialEntries: ['/clients/all?filter.status=active'] },
    );

    await user.click(screen.getByRole('button', { name: 'Open page four' }));

    expect(screen.getByRole('status', { name: 'Current search parameters' })).toHaveTextContent(
      '?page=4&filter.status=active',
    );
  });
});
