/** The languages the app ships, each named in itself, as a language menu lists them. */
export const LANGUAGES = [
  { code: 'pl', name: 'Polski' },
  { code: 'en', name: 'English' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: Language = 'pl';

const LANGUAGE_STORAGE_KEY = 'scaffold.language';

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some(({ code }) => code === value);
}

/** The language the user last picked in this browser, if it is one the app ships. */
export function readStoredLanguage(): Language | undefined {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

export function storeLanguage(language: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage can be disabled by browser policy; the language then lasts until a reload.
  }
}
