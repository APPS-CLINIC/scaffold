import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TableToolbar } from './TableToolbar';

describe('TableToolbar', () => {
  it('keeps supplied controls interactive and ordered as filters, search and actions', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    const expand = vi.fn();
    render(
      <TableToolbar
        filters={<button onClick={open}>Filters</button>}
        search={<input aria-label="Search" defaultValue="Saved search" />}
        actions={<button onClick={expand}>Expand</button>}
      />,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(open).toHaveBeenCalledOnce();
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
    await user.type(screen.getByRole('textbox'), ' query');
    expect(screen.getByRole('textbox')).toHaveValue('Saved search query');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(expand).toHaveBeenCalledOnce();
  });

  it('forwards attributes and ref, and allows caller classes to override the layout', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TableToolbar
        ref={ref}
        filters={null}
        search={<input aria-label="Search" />}
        aria-label="List controls"
        className="gap-2 p-6"
      />,
    );
    expect(ref.current).toHaveAttribute('aria-label', 'List controls');
    expect(ref.current).toHaveClass('gap-2', 'p-6');
    expect(ref.current).not.toHaveClass('gap-8', 'p-3');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
