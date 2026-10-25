import { createContext, type ReactNode, type RefObject } from 'react';

/** What the underlined link at the end of a toast does. */
export type ToastAction =
  /** An action in the app. */
  | { label: string; onClick: () => void }
  /** A route in the app, opened without reloading the page. */
  | { label: string; to: string }
  /** A page outside the app, in a new tab. */
  | { label: string; href: string };

/** Every toast looks the same; only its message and how long it stays differ. */
export interface Toast {
  message: ReactNode;
  /** Shown before the message: a spinner, a pictogram, or `<ToastErrorIcon />` for an error. */
  icon?: ReactNode;
  action?: ToastAction;
  /** The element the toast spans; the page content when left out or not on screen. */
  area?: RefObject<HTMLElement | null>;
  /** Stays on screen, without a close button, until its handle hides it. */
  persistent?: boolean;
}

export interface ToastHandle {
  /**
   * Replaces this toast with `next` where it is: on screen at once when it is on top, else once
   * the toasts over it go. Does nothing once the toast is gone.
   */
  update: (next: Toast) => void;
  /** Hides this toast; a persistent toast it covered comes back. */
  hide: () => void;
}

export interface ToastApi {
  /**
   * Shows the toast over the one on screen. A persistent toast it covers comes back once it
   * goes; any other toast it covers is dropped.
   */
  show: (toast: Toast) => ToastHandle;
  /** Hides the toast on screen. */
  hide: () => void;
}

/**
 * Context in its own module so the provider component and the `useToast` hook
 * can share it without tripping `react-refresh/only-export-components`.
 */
export const ToastContext = createContext<ToastApi | null>(null);
