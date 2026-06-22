import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { pl, type MessageKey } from './messages/pl';
import { en } from './messages/en';
import {
  DEFAULT_LOCALE,
  I18nContext,
  type Locale,
  type TFunction,
  type TVars,
} from './i18n.context';

const dictionaries: Record<Locale, Record<MessageKey, string>> = { pl, en };

function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export interface I18nProviderProps {
  children: ReactNode;
  /** Initial locale; defaults to Polish. */
  initialLocale?: Locale;
}

/**
 * Provides the active locale and a `t()` translator. Deliberately
 * dependency-free so the choice of i18n library stays open
 * (see docs/adr/0014-internationalization-i18n.md) — swap the internals here
 * without touching consumers.
 */
export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const t = useCallback<TFunction>(
    (key, vars) => {
      // Fall back to the canonical Polish catalog, then to the raw key.
      const template = dictionaries[locale][key] ?? pl[key] ?? key;
      return interpolate(template, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
