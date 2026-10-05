import type { SetStateAction } from 'react';

// The library pads the content and sizes the dialog itself, hence the important modifiers.
// Without the padding the separators reach the dialog edges, so every section pads itself.
export const DIALOG_CONTENT_CLASS_NAME = 'flex min-h-0 flex-col !p-0';
export const DIALOG_FOOTER_CLASS_NAME =
  'flex shrink-0 gap-3 border-t border-[var(--border-subtle)] px-6 py-4';

/** The library's visibility setter takes a state setter's argument, so a function is applied. */
export function resolveVisibility(next: SetStateAction<boolean>, current: boolean): boolean {
  return typeof next === 'function' ? next(current) : next;
}
