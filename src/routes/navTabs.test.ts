import { describe, expect, it } from 'vitest';
import { defaultNavTabKey, navTabs, parseActiveTab } from './navTabs';

describe('parseActiveTab', () => {
  it('maps every tab root path to its tab key', () => {
    for (const tab of navTabs) {
      expect(parseActiveTab(tab.path)).toBe(tab.key);
    }
  });

  it('keeps nested paths within their section', () => {
    expect(parseActiveTab('/customers/42')).toBe('customers');
    expect(parseActiveTab('/bi-reports/monthly/2026')).toBe('bi-reports');
  });

  it('does not match on a bare prefix (no separator)', () => {
    expect(parseActiveTab('/customers-archive')).toBe(defaultNavTabKey);
  });

  it('falls back to the default tab for unknown paths', () => {
    expect(parseActiveTab('/no-such-page')).toBe(defaultNavTabKey);
  });
});
