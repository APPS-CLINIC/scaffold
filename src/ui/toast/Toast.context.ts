import { createContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

export interface ToastApi {
  show: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

/**
 * Context in its own module so the provider component and the `useToast` hook
 * can share it without tripping `react-refresh/only-export-components`.
 */
export const ToastContext = createContext<ToastApi | null>(null);
