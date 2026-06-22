import { useContext } from 'react';
import { I18nContext, type I18nContextValue, type TFunction } from './i18n.context';

/** Full i18n context: `{ locale, setLocale, t }`. Throws if used outside the provider. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}

/** Convenience hook for the translator alone. */
export function useT(): TFunction {
  return useI18n().t;
}
