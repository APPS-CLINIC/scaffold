import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { pl } from './messages/pl';
import { en } from './messages/en';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  readStoredLanguage,
  storeLanguage,
  type Language,
  type LanguageOption,
} from './languages';

/**
 * i18next configuration. Resources are bundled, so init is synchronous and no
 * Suspense/loading boundary is needed. Keys are flat dotted strings
 * (`keySeparator: false`) and interpolation uses `{{var}}`.
 *
 * Components translate with `useTranslation()` from `react-i18next`; key
 * type-safety comes from `src/i18n/i18next.d.ts`. Import this module once
 * (`import '@/i18n'`) to initialize the singleton.
 *
 * The app starts in the language the user last picked in this browser, else in
 * Polish, and the page's `lang` follows the language.
 */
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: readStoredLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES.map(({ code }: LanguageOption) => code),
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/** Switches the app to `language` and remembers the pick in this browser for the next visit. */
export function chooseLanguage(language: Language) {
  storeLanguage(language);
  return i18n.changeLanguage(language);
}

export { LANGUAGES, type Language, type LanguageOption } from './languages';
export default i18n;
