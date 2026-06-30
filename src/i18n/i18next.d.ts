import 'i18next';
import type { pl } from './messages/pl';

/**
 * Makes `t()` keys type-safe: only keys present in the Polish catalog compile,
 * and a typo is a build error. Keys are flat (`keySeparator: false`).
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof pl };
    keySeparator: false;
  }
}
