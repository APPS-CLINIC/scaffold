import { createContext } from 'react';

export type ToastType = 'info' | 'success' | 'error';

export interface Toast {
  type: ToastType;
  message: string;
}

export interface ToastApi {
  /** Shows the toast in place of the one on screen, if any. */
  show: (toast: Toast) => void;
  hide: () => void;
}

/**
 * Context in its own module so the provider component and the `useToast` hook
 * can share it without tripping `react-refresh/only-export-components`.
 */
export const ToastContext = createContext<ToastApi | null>(null);
