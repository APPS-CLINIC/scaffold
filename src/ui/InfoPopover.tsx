import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { twMerge } from 'iwa-react-components';

export interface InfoPopoverProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClick' | 'onFocus' | 'onBlur' | 'onMouseEnter' | 'onMouseLeave' | 'onKeyDown'
> {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  muted?: boolean;
  className?: string;
}

/**
 * Information on hover or focus, pinned by click. Content may contain links, so it is
 * a non-modal dialog rather than a tooltip. The panel portals outside scrolling cells.
 */
export const InfoPopover = forwardRef<HTMLButtonElement, InfoPopoverProps>(function InfoPopover(
  { label, trigger, children, muted = false, className, ...rest },
  forwardedRef,
) {
  const id = useId();
  const panel = useRef<OverlayPanel>(null);
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pinned = useRef(false);
  const focusOnShow = useRef(false);
  const skipFocusOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const cancelTimer = () => clearTimeout(timer.current);
  const hide = () => {
    cancelTimer();
    pinned.current = false;
    focusOnShow.current = false;
    panel.current?.hide();
    setOpen(false);
  };
  const show = () => {
    cancelTimer();
    panel.current?.show(null, button.current);
    setOpen(true);
  };
  const leave = () => {
    cancelTimer();
    if (!pinned.current) timer.current = setTimeout(hide, 200);
  };
  const focusPanel = () =>
    panel.current?.getElement()?.querySelector<HTMLElement>('a, button, [tabindex="0"]')?.focus();

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <>
      <button
        {...rest}
        ref={(element) => {
          button.current = element;
          if (typeof forwardedRef === 'function') forwardedRef(element);
          else if (forwardedRef) forwardedRef.current = element;
        }}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        aria-expanded={open}
        className={twMerge(
          'relative inline-flex h-8 min-w-8 items-center justify-center rounded text-[var(--navigation-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]',
          muted && 'text-[var(--muted)] opacity-60',
          className,
        )}
        onMouseEnter={() => {
          cancelTimer();
          timer.current = setTimeout(show, 250);
        }}
        onMouseLeave={leave}
        onFocus={() => {
          if (skipFocusOpen.current) skipFocusOpen.current = false;
          else show();
        }}
        onBlur={(event) => {
          if (!panel.current?.getElement()?.contains(event.relatedTarget)) leave();
        }}
        onClick={() => {
          if (pinned.current) hide();
          else {
            pinned.current = true;
            focusOnShow.current = true;
            show();
            if (open) {
              focusOnShow.current = false;
              focusPanel();
            }
          }
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape') hide();
          if (event.key === 'ArrowDown' && open) {
            event.preventDefault();
            focusPanel();
          }
        }}
      >
        {trigger}
      </button>
      <OverlayPanel
        ref={panel}
        id={id}
        appendTo={document.body}
        className="!max-w-[min(24rem,calc(100vw-2rem))] !bg-[var(--text)] !text-[var(--surface)]"
        onShow={() => {
          if (focusOnShow.current) {
            focusOnShow.current = false;
            focusPanel();
          }
        }}
        onHide={() => {
          pinned.current = false;
          setOpen(false);
        }}
        pt={{
          root: {
            role: 'dialog',
            'aria-label': label,
            onMouseEnter: cancelTimer,
            onMouseLeave: leave,
            onFocus: cancelTimer,
            onBlur: (event) => {
              if (
                !event.currentTarget.contains(event.relatedTarget) &&
                event.relatedTarget !== button.current
              )
                leave();
            },
            onKeyDown: (event) => {
              event.stopPropagation();
              if (event.key === 'Escape') {
                hide();
                skipFocusOpen.current = true;
                button.current?.focus();
              }
            },
          },
          content: { className: '!p-3 text-sm break-words' },
        }}
      >
        {children}
      </OverlayPanel>
    </>
  );
});
