import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ItemsToolbar } from './ItemsToolbar';

describe('ItemsToolbar', () => {
  it('reflects status from the initial URL', () => {
    renderWithProviders(<ItemsToolbar />, { initialEntries: ['/items?status=active'] });
    expect(screen.getByLabelText('Status filter')).toHaveValue('active');
  });

  it('toggles sort direction on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ItemsToolbar />, { initialEntries: ['/items'] });

    // Default direction is descending.
    const toggle = screen.getByRole('button', { name: /toggle sort direction/i });
    expect(toggle).toHaveTextContent('Desc');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: /toggle sort direction/i })).toHaveTextContent('Asc');
  });
});
