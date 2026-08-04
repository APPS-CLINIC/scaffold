import { screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { renderWithProviders } from './renderWithProviders';

function InitialLocationProbe() {
  const location = useLocation();
  const query = useAppSelector(selectListQuery);

  return <output>{`${location.pathname}:${query.q}`}</output>;
}

describe('renderWithProviders', () => {
  it('seeds Redux from the same history entry that MemoryRouter renders first', () => {
    renderWithProviders(<InitialLocationProbe />, {
      initialEntries: ['/clients/all?q=first', '/clients/advisors?q=last'],
    });

    expect(screen.getByRole('status')).toHaveTextContent('/clients/advisors:last');
  });
});
