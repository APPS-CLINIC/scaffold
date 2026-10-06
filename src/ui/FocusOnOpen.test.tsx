import { render, screen, waitFor } from '@testing-library/react';
import { Dialog } from 'primereact/dialog';
import { describe, expect, it, vi } from 'vitest';
import { FocusOnOpen } from './FocusOnOpen';

describe('FocusOnOpen', () => {
  it('focuses its target once mounted', async () => {
    render(
      <>
        <button type="button">Other</button>
        <FocusOnOpen target={() => document.getElementById('first')} />
        <input id="first" aria-label="First" />
      </>,
    );

    await waitFor(() => expect(screen.getByLabelText('First')).toHaveFocus());
  });

  // The IWA dialog is a PrimeReact dialog, whose focus trap moves focus to the close button
  // when it opens.
  it('keeps focus on its target after a PrimeReact dialog has set its own initial focus', async () => {
    render(
      <Dialog unstyled visible header="Filters" onHide={vi.fn()}>
        <FocusOnOpen target={() => document.getElementById('first')} />
        <input id="first" aria-label="First" />
      </Dialog>,
    );

    await waitFor(() => expect(screen.getByLabelText('First')).toHaveFocus());
    // The dialog checks focus again once its opening transition has ended.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.getByLabelText('First')).toHaveFocus();
  });

  it('does nothing when the target is missing', async () => {
    render(<FocusOnOpen target={() => null} />);

    await Promise.resolve();
    expect(document.body).toHaveFocus();
  });
});
