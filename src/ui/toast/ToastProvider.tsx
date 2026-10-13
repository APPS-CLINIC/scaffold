import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Snackbar } from '@/ui';
import { ToastContext, type Toast, type ToastApi } from './Toast.context';

const LEFT_VARIABLE = '--toast-area-left';
const WIDTH_VARIABLE = '--toast-area-width';

// The snackbar is drawn over the page, not where it sits in the markup, so it is pinned to the
// bottom of the screen across the span `useAreaSpan` publishes.
const TOAST_CLASS_NAME =
  '!fixed !bottom-6 !top-auto !right-auto !left-[var(--toast-area-left)] !z-50 !m-0 !w-[var(--toast-area-width)] !max-w-none ![transform:none]';

/**
 * While `active`, keeps the left edge and the width of the element under `ref` in CSS
 * variables on the page root, where the snackbar outside the element can read them.
 */
function useAreaSpan(ref: RefObject<HTMLElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || element === null) return undefined;
    const root = document.documentElement;
    const update = () => {
      const { left, width } = element.getBoundingClientRect();
      root.style.setProperty(LEFT_VARIABLE, `${left}px`);
      root.style.setProperty(WIDTH_VARIABLE, `${width}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty(LEFT_VARIABLE);
      root.style.removeProperty(WIDTH_VARIABLE);
    };
  }, [active, ref]);
}

/**
 * Shows the toasts of the content it wraps, one at a time, as the IWA Snackbar across that
 * content rather than the whole window. Wrap the page content with it, inside the app shell.
 * An empty block after the content measures the content's width, so the content keeps its
 * own markup.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const spanRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);
  useAreaSpan(spanRef, visible);

  const show = useCallback<ToastApi['show']>((next) => {
    setToast(next);
    setVisible(true);
  }, []);
  const hide = useCallback<ToastApi['hide']>(() => setVisible(false), []);
  const api = useMemo<ToastApi>(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext value={api}>
      {children}
      <div ref={spanRef} aria-hidden="true" />
      <Snackbar
        visibility={visible}
        onHide={hide}
        type={toast?.type ?? 'info'}
        message={toast?.message ?? ''}
        className={TOAST_CLASS_NAME}
      />
    </ToastContext>
  );
}
