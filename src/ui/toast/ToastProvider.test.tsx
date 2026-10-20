import type { ComponentProps } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

type SnackbarProps = ComponentProps<typeof IwaComponents.Snackbar>;

// The snackbar is checked through the props handed to the library: its markup is vendor
// markup that differs between the test double and the real library.
let captured: SnackbarProps | null = null;

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    Snackbar: (props: SnackbarProps) => {
      captured = props;
      return <actual.Snackbar {...props} />;
    },
  };
});

function snackbar(): SnackbarProps {
  if (captured === null) throw new Error('Snackbar was not rendered');
  return captured;
}

function Page() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.show({ type: 'info', message: 'Saving' })}>
        Save
      </button>
      <button type="button" onClick={() => toast.show({ type: 'error', message: 'Not saved' })}>
        Fail
      </button>
    </>
  );
}

class InertResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  captured = null;
  vi.stubGlobal('ResizeObserver', InertResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ToastProvider', () => {
  it('shows one toast at a time, the latest in place of the one on screen', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Page />
      </ToastProvider>,
    );
    expect(snackbar().visibility).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(snackbar()).toMatchObject({ visibility: true, type: 'info', message: 'Saving' });

    await user.click(screen.getByRole('button', { name: 'Fail' }));
    expect(snackbar()).toMatchObject({ visibility: true, type: 'error', message: 'Not saved' });

    act(() => snackbar().onHide(false));
    expect(snackbar().visibility).toBe(false);
  });

  it('spans the toast across the content it wraps, at the bottom of the screen', async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 240,
      width: 1380,
    } as DOMRect);
    render(
      <ToastProvider>
        <Page />
      </ToastProvider>,
    );
    const rootStyle = document.documentElement.style;

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(snackbar().className).toContain('!fixed');
    expect(snackbar().className).toContain('!left-[var(--toast-area-left)]');
    expect(snackbar().className).toContain('!w-[var(--toast-area-width)]');
    expect(rootStyle.getPropertyValue('--toast-area-left')).toBe('240px');
    expect(rootStyle.getPropertyValue('--toast-area-width')).toBe('1380px');

    act(() => snackbar().onHide(false));

    expect(rootStyle.getPropertyValue('--toast-area-left')).toBe('');
    expect(rootStyle.getPropertyValue('--toast-area-width')).toBe('');
  });
});
