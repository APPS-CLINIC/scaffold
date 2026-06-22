import { useContext } from 'react';
import { ToastContext, type ToastApi } from './Toast.context';

/** Imperative toast API. Throws if used outside `<ToastProvider>`. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
