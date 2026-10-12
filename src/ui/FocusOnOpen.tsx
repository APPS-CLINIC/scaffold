import { useEffect, useRef } from 'react';

export interface FocusOnOpenProps {
  /** The element to focus, looked up once the dialog is open. */
  target: () => HTMLElement | null | undefined;
}

/**
 * Moves focus to `target` once the dialog is open. The library's focus trap puts focus on
 * the close button in its own mount effect, which runs after this one, so the move waits
 * for a microtask: it then lands after the trap, and the trap keeps focus that is already
 * inside the dialog.
 */
export function FocusOnOpen({ target }: FocusOnOpenProps) {
  const targetRef = useRef(target);

  useEffect(() => {
    queueMicrotask(() => targetRef.current()?.focus());
  }, []);

  return null;
}
