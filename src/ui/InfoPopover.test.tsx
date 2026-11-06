import { createRef } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InfoPopover } from './InfoPopover';
import { mockOverlayLayout } from '@/test/overlayLayout';
import { userWithFakeTimers } from '@/test/userWithFakeTimers';

const appendToHead = document.head.appendChild.bind(document.head);
beforeEach(() => {
  mockOverlayLayout();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Example({ muted = false }: { muted?: boolean }) {
  return (
    <PrimeReactProvider value={{ cssTransition: false }}>
      <InfoPopover label="Currencies" trigger={<span aria-hidden="true">€</span>} muted={muted}>
        <p>EUR, PLN</p>
        <a href="/example">Open details</a>
      </InfoPopover>
      <button type="button">Next control</button>
    </PrimeReactProvider>
  );
}

describe('InfoPopover', () => {
  it('opens from the keyboard, makes its action reachable and closes on Escape with focus restored', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Currencies' });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('dialog', { name: 'Currencies' });
    expect(panel.parentElement).toBe(document.body);
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    await user.keyboard('{ArrowDown}');
    expect(within(panel).getByRole('link', { name: 'Open details' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a muted icon informative and allows a pinned panel to close from its trigger', async () => {
    const user = userEvent.setup();
    render(<Example muted />);
    const trigger = screen.getByRole('button', { name: 'Currencies' });
    expect(trigger).toHaveClass('opacity-60');
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Currencies' })).toBeInTheDocument();
    await user.click(trigger);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('waits briefly on hover and leaves enough time to enter its portalled content', async () => {
    const user = userWithFakeTimers();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Currencies' });
    await user.hover(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(250));
    const panel = screen.getByRole('dialog', { name: 'Currencies' });
    await user.unhover(trigger);
    await user.hover(panel);
    await act(() => vi.advanceTimersByTimeAsync(250));
    expect(screen.getByRole('dialog', { name: 'Currencies' })).toBeInTheDocument();
    await user.unhover(panel);
    await act(() => vi.advanceTimersByTimeAsync(250));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('forwards the trigger ref and caller classes', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <InfoPopover ref={ref} label="Information" trigger="i" className="h-12 custom-info">
        Example
      </InfoPopover>,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Information' }));
    expect(ref.current).toHaveClass('h-12', 'custom-info');
  });
});
