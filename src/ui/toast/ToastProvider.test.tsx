import { useRef, type ComponentProps, type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastErrorIcon } from './ToastErrorIcon';
import { ToastProvider } from './ToastProvider';
import type { Toast, ToastApi, ToastHandle } from './Toast.context';
import { useToast } from './useToast';

type SnackbarProps = ComponentProps<typeof IwaComponents.Snackbar>;

// The snackbar is checked through the props handed to the library: its markup is vendor
// markup that differs between the test double and the real library. What it shows inside is
// ours.
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

let toastApi: ToastApi | null = null;

function ToastApiProbe() {
  toastApi = useToast();
  return null;
}

function LocationProbe() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderToasts(content: ReactNode = null) {
  return render(
    <MemoryRouter initialEntries={['/customers']}>
      <ToastProvider>
        <ToastApiProbe />
        {content}
      </ToastProvider>
      <LocationProbe />
    </MemoryRouter>,
  );
}

function show(toast: Toast): ToastHandle {
  if (toastApi === null) throw new Error('ToastProvider was not rendered');
  const api = toastApi;
  let handle: ToastHandle | null = null;
  act(() => {
    handle = api.show(toast);
  });
  if (handle === null) throw new Error('show() returned no handle');
  return handle;
}

/** The close button of the toast on screen. */
function closeToast() {
  act(() => snackbar().onHide(false));
}

const onScreen = (text: string) => screen.queryByText(text) !== null;

class InertResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  captured = null;
  toastApi = null;
  vi.stubGlobal('ResizeObserver', InertResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ToastProvider', () => {
  it('shows the newest toast, in the same dark bar, and drops a closable toast it covers', () => {
    renderToasts();
    expect(snackbar().visibility).toBe(false);

    show({ message: 'Saving' });
    expect(snackbar()).toMatchObject({ visibility: true, type: 'default' });
    expect(onScreen('Saving')).toBe(true);

    show({ message: 'Not saved' });
    expect(onScreen('Not saved')).toBe(true);
    expect(onScreen('Saving')).toBe(false);

    closeToast();
    expect(snackbar().visibility).toBe(false);
  });

  it('keeps a persistent toast on screen, without a close button, until its handle hides it', () => {
    renderToasts();

    const loading = show({ message: <strong>Loading</strong>, persistent: true });

    expect(snackbar()).toMatchObject({ visibility: true, closable: false });
    expect(snackbar().hideTimeoutMs).toBe(2 ** 31 - 1);
    expect(screen.getByText('Loading').tagName).toBe('STRONG');

    act(() => loading.hide());

    expect(snackbar().visibility).toBe(false);
  });

  it('brings back a persistent toast once the toast over it goes', () => {
    renderToasts();
    show({ message: 'Loading', persistent: true });

    show({ message: 'Exporting' });
    expect(onScreen('Loading')).toBe(false);
    expect(snackbar().closable).toBeUndefined();

    closeToast();

    expect(onScreen('Loading')).toBe(true);
    expect(snackbar()).toMatchObject({ visibility: true, closable: false });
  });

  it('leaves a later toast on screen when the handle of an earlier one hides it', () => {
    renderToasts();
    const loading = show({ message: 'Loading', persistent: true });
    show({ message: 'Exporting' });

    act(() => loading.hide());

    expect(onScreen('Exporting')).toBe(true);
    closeToast();
    expect(snackbar().visibility).toBe(false);
  });

  it('replaces a toast in place: at once on top, and once uncovered below', () => {
    renderToasts();
    const download = show({ message: 'Download started', persistent: true });
    const loading = show({ message: 'Loading', persistent: true });

    act(() => download.update({ message: 'Downloaded' }));
    expect(onScreen('Loading')).toBe(true);

    act(() => loading.update({ message: 'Loading takes long', persistent: true }));
    expect(onScreen('Loading takes long')).toBe(true);

    act(() => loading.hide());
    expect(onScreen('Downloaded')).toBe(true);
    expect(snackbar().closable).toBeUndefined();

    closeToast();
    act(() => download.update({ message: 'Too late' }));
    expect(snackbar().visibility).toBe(false);
  });

  it('draws the icon before the text, and the red cross for an error in the same bar', () => {
    renderToasts();

    show({ message: 'Exporting', icon: <span data-testid="spinner" /> });
    const spinner = screen.getByTestId('spinner');
    expect(spinner.compareDocumentPosition(screen.getByText('Exporting'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    show({ message: 'Not downloaded', icon: <ToastErrorIcon /> });
    const cross = screen
      .getByText('Not downloaded')
      .parentElement?.querySelector('.pi-times-circle');
    expect(cross).not.toBeNull();
    expect(cross).toHaveAttribute('aria-hidden', 'true');
    expect(snackbar().type).toBe('default');
  });

  it('ends the toast with an action in the app, a route, or a page in a new tab', () => {
    const onRetry = vi.fn();
    renderToasts();

    show({ message: 'Not loaded', action: { label: 'Try again', onClick: onRetry } });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    show({ message: 'Downloaded', action: { label: 'Open reports', to: '/reports' } });
    fireEvent.click(screen.getByRole('link', { name: 'Open reports' }));
    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent('/reports');

    show({ message: 'Read more', action: { label: 'Help', href: 'https://example.com/help' } });
    expect(screen.getByRole('link', { name: 'Help' })).toMatchObject({
      href: 'https://example.com/help',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });

  it('spans the toast across the content it wraps, at the bottom of the screen', () => {
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 240,
      width: 1380,
    } as DOMRect);
    renderToasts();
    const rootStyle = document.documentElement.style;

    show({ message: 'Saving' });

    expect(snackbar().className).toContain('!fixed');
    expect(snackbar().className).toContain('!left-[var(--toast-area-left)]');
    expect(snackbar().className).toContain('!w-[var(--toast-area-width)]');
    expect(rootStyle.getPropertyValue('--toast-area-left')).toBe('240px');
    expect(rootStyle.getPropertyValue('--toast-area-width')).toBe('1380px');

    closeToast();

    expect(rootStyle.getPropertyValue('--toast-area-left')).toBe('');
    expect(rootStyle.getPropertyValue('--toast-area-width')).toBe('');
  });

  it('spans the area a toast names instead of the content', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return (
        this.tagName === 'SECTION' ? { left: 600, width: 400 } : { left: 240, width: 1380 }
      ) as DOMRect;
    });
    function Panel() {
      const area = useRef<HTMLElement>(null);
      return (
        <section ref={area}>
          <button type="button" onClick={() => toastApi?.show({ message: 'Saved here', area })}>
            Save the panel
          </button>
        </section>
      );
    }
    renderToasts(<Panel />);
    const rootStyle = document.documentElement.style;

    fireEvent.click(screen.getByRole('button', { name: 'Save the panel' }));

    expect(rootStyle.getPropertyValue('--toast-area-left')).toBe('600px');
    expect(rootStyle.getPropertyValue('--toast-area-width')).toBe('400px');
  });
});
