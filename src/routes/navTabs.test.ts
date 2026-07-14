import { describe, expect, it } from 'vitest';
import { defaultNavTabKey, navTabs, parseActiveTab } from './navTabs';

describe('parseActiveTab', () => {
  it('maps every tab root path to its tab key', () => {
    for (const tab of navTabs) {
      expect(parseActiveTab(tab.path)).toBe(tab.key);
    }
  });

  it('keeps nested paths within their section', () => {
    expect(parseActiveTab('/klienci/42')).toBe('klienci');
    expect(parseActiveTab('/raporty-bi/miesieczne/2026')).toBe('raporty-bi');
  });

  it('does not match on a bare prefix (no separator)', () => {
    expect(parseActiveTab('/klienci-archiwum')).toBe(defaultNavTabKey);
  });

  it('falls back to the default tab for unknown paths', () => {
    expect(parseActiveTab('/nie-ma-takiej-strony')).toBe(defaultNavTabKey);
  });
});
