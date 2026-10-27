import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Link } from 'react-router-dom';
import { Snackbar } from '@/ui';
import { ToastContext, type Toast, type ToastAction, type ToastApi } from './Toast.context';

const LEFT_VARIABLE = '--toast-area-left';
const WIDTH_VARIABLE = '--toast-area-width';

// The library hides a snackbar without a close button after `hideTimeoutMs`. The longest
// timeout a browser keeps (2^31 - 1 ms, about 24 days) holds a persistent toast until its
// handle hides it.
const PERSISTENT_TIMEOUT_MS = 2_147_483_647;

// Loading, a download and a failure all show the same dark bar of the mock-ups.
const TOAST_TYPE = 'default';

// The snackbar is drawn over the page, not where it sits in the markup, so it is pinned to the
// bottom of the screen across the span `useAreaSpan` publishes.
const TOAST_CLASS_NAME =
  '!fixed !bottom-6 !top-auto !right-auto !left-[var(--toast-area-left)] !z-50 !m-0 !w-[var(--toast-area-width)] !max-w-none ![transform:none]';

const ACTION_CLASS_NAME =
  'cursor-pointer rounded-sm border-0 bg-transparent p-0 text-inherit underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

interface OpenToast {
  id: number;
  toast: Toast;
}

/**
 * Puts `entry` on top; of the toasts it covers, only the persistent ones stay. Every covered
 * toast is checked, not only the top one: `update` can make a toast under the top closable.
 */
function putOnTop(open: readonly OpenToast[], entry: OpenToast): OpenToast[] {
  return [...open.filter((other) => other.toast.persistent), entry];
}

/**
 * While `active`, keeps the left edge and the width of `area`, or of `content` when `area` is
 * not on screen, in CSS variables on the page root, where the snackbar can read them.
 */
function useAreaSpan(
  area: RefObject<HTMLElement | null> | undefined,
  content: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useLayoutEffect(() => {
    const element = area?.current ?? content.current;
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
  }, [active, area, content]);
}

// The library's snackbar link only takes a URL, which reloads the page for a route, so the
// link is drawn here: a button, a router link, or a link to a new tab.
function ToastActionLink({ action }: { action: ToastAction }) {
  if ('onClick' in action) {
    return (
      <button type="button" className={ACTION_CLASS_NAME} onClick={action.onClick}>
        {action.label}
      </button>
    );
  }
  if ('to' in action) {
    return (
      <Link to={action.to} className={ACTION_CLASS_NAME}>
        {action.label}
      </Link>
    );
  }
  return (
    <a href={action.href} target="_blank" rel="noopener noreferrer" className={ACTION_CLASS_NAME}>
      {action.label}
    </a>
  );
}

function ToastContent({ toast }: { toast: Toast }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {toast.icon}
      <span>{toast.message}</span>
      {toast.action ? <ToastActionLink action={toast.action} /> : null}
    </span>
  );
}

/**
 * Shows the toasts of the content it wraps as the IWA Snackbar across that content rather
 * than the whole window: the newest on screen, and a persistent toast it covers back once it
 * goes. Wrap the page content with it, inside the app shell and the router. An empty block
 * after the content measures the content's width, so the content keeps its own markup.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const spanRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(0);
  const [open, setOpen] = useState<readonly OpenToast[]>([]);
  const top = open.at(-1);
  // The last toast stays drawn while the snackbar hides, so its text does not go first.
  const [drawn, setDrawn] = useState<Toast | null>(null);
  if (top !== undefined && top.toast !== drawn) setDrawn(top.toast);
  const visible = top !== undefined;
  useAreaSpan(drawn?.area, spanRef, visible);

  const remove = useCallback((id: number) => {
    setOpen((current) => current.filter((entry) => entry.id !== id));
  }, []);
  const show = useCallback<ToastApi['show']>(
    (toast) => {
      nextIdRef.current += 1;
      const id = nextIdRef.current;
      setOpen((current) => putOnTop(current, { id, toast }));
      return {
        update: (next) =>
          setOpen((current) =>
            current.map((entry) => (entry.id === id ? { id, toast: next } : entry)),
          ),
        hide: () => remove(id),
      };
    },
    [remove],
  );
  const hide = useCallback<ToastApi['hide']>(() => setOpen((current) => current.slice(0, -1)), []);
  const api = useMemo<ToastApi>(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext value={api}>
      {children}
      <div ref={spanRef} aria-hidden="true" />
      <Snackbar
        visibility={visible}
        onHide={() => {
          if (top !== undefined) remove(top.id);
        }}
        type={TOAST_TYPE}
        message={drawn ? <ToastContent toast={drawn} /> : ''}
        {...(drawn?.persistent ? { closable: false, hideTimeoutMs: PERSISTENT_TIMEOUT_MS } : {})}
        className={TOAST_CLASS_NAME}
      />
    </ToastContext>
  );
}
