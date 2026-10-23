import { createContext, type ReactNode } from 'react';

export type ToastType = 'default' | 'info' | 'success' | 'error';

export interface Toast {
  type: ToastType;
  message: ReactNode;
  /** Stays on screen, without a close button, until its handle hides it. */
  persistent?: boolean;
}

export interface ToastHandle {
  /** Hides this toast; does nothing once another toast took its place. */
  hide: () => void;
}

export interface ToastApi {
  /** Shows the toast in place of the one on screen, if any. */
  show: (toast: Toast) => ToastHandle;
  hide: () => void;
}

/**
 * Context in its own module so the provider component and the `useToast` hook
 * can share it without tripping `react-refresh/only-export-components`.
 */
export const ToastContext = createContext<ToastApi | null>(null);
