import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Toast.module.css';
import { ToastContext, type Toast, type ToastApi } from './Toast.context';

let counter = 0;

/**
 * Placeholder notification host. The contract (`useToast().show(...)`) is what
 * features depend on; swap the rendering for IWA / PrimeReact Toast later
 * without touching callers (see docs/adr/0013-iwa-components-primereact.md).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback<ToastApi['dismiss']>(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  const show = useCallback<ToastApi['show']>((toast) => {
    counter += 1;
    setToasts((prev) => [...prev, { ...toast, id: `toast-${counter}` }]);
  }, []);

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext value={api}>
      {children}
      <div className={styles.container} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className={cx(styles.toast, styles[toast.tone])}
            onClick={() => dismiss(toast.id)}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext>
  );
}
