import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { pl } from './messages/pl';
import { en } from './messages/en';

/**
 * i18next configuration. Resources are bundled, so init is synchronous and no
 * Suspense/loading boundary is needed. Keys are flat dotted strings
 * (`keySeparator: false`) and interpolation uses `{{var}}`.
 *
 * Components translate with `useTranslation()` from `react-i18next`; key
 * type-safety comes from `src/i18n/i18next.d.ts`. Import this module once
 * (`import '@/i18n'`) to initialize the singleton.
 */
void i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: 'pl',
  fallbackLng: 'pl',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
