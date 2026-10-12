import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredLanguage, storeLanguage } from './languages';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('stored language', () => {
  it('reads back the language stored last', () => {
    storeLanguage('en');

    expect(readStoredLanguage()).toBe('en');
  });

  it('ignores a stored value that is not a language the app ships', () => {
    window.localStorage.setItem('scaffold.language', 'de');

    expect(readStoredLanguage()).toBeUndefined();
  });

  it('has no language when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => storeLanguage('en')).not.toThrow();
    expect(readStoredLanguage()).toBeUndefined();
  });
});
