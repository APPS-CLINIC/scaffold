import { createContext } from 'react';
import type { MessageKey } from './messages/pl';

export type Locale = 'pl' | 'en';

export const LOCALES: readonly Locale[] = ['pl', 'en'];
export const DEFAULT_LOCALE: Locale = 'pl';

/** Variables for `{placeholder}` interpolation. */
export type TVars = Record<string, string | number>;

/** Translate a key, optionally interpolating `{placeholder}` variables. */
export type TFunction = (key: MessageKey, vars?: TVars) => string;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

/**
 * Context kept in its own (non-component) module so the provider component and
 * the hooks can share it without tripping the `react-refresh/only-export-components`
 * lint rule.
 */
export const I18nContext = createContext<I18nContextValue | null>(null);
