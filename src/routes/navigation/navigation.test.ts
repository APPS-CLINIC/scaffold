import { describe, expect, it } from 'vitest';
import {
  getActiveNavigationItem,
  getActiveNavigationSection,
  getContextualNavigationItems,
  getNavigationItemPath,
  getNavigationSectionDefaultPath,
  getVisibleNavigationItems,
  navigationSections,
  type NavigationSection,
} from './index';

const TestIcon = () => null;

describe('navigation configuration', () => {
  it('keeps section keys and every generated route unique', () => {
    const sectionKeys = navigationSections.map((section) => section.key);
    const paths = navigationSections.flatMap((section) => [
      section.path,
      ...section.items.map((item) => getNavigationItemPath(section, item)),
    ]);

    expect(new Set(sectionKeys).size).toBe(sectionKeys.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps each default item inside its own section', () => {
    for (const section of navigationSections) {
      if (!section.defaultItemId) continue;
      expect(section.items.some((item) => item.id === section.defaultItemId)).toBe(true);
    }
  });

  it('derives default destinations without duplicating full item paths', () => {
    const portfolio = navigationSections.find((section) => section.key === 'portfolio');
    const customers = navigationSections.find((section) => section.key === 'customers');

    expect(portfolio && getNavigationSectionDefaultPath(portfolio)).toBe('/portfolio/dashboard');
    expect(customers && getNavigationSectionDefaultPath(customers)).toBe('/customers/all');
  });

  it('provides a root-link fallback for sections without dedicated items', () => {
    const groups = navigationSections.find((section) => section.key === 'groups');

    expect(groups && getContextualNavigationItems(groups).map((item) => item.id)).toEqual([
      'overview',
    ]);
    expect(groups && getNavigationItemPath(groups, getContextualNavigationItems(groups)[0]!)).toBe(
      '/groups',
    );
    expect(groups && getActiveNavigationItem(groups, '/groups')?.id).toBe('overview');
  });

  it('keeps configured IWA icon components on contextual items', () => {
    const portfolio = navigationSections.find((section) => section.key === 'portfolio');

    expect(portfolio?.items.every((item) => item.icon)).toBe(true);
  });

  it('matches section and item state from nested URLs', () => {
    const section = getActiveNavigationSection('/portfolio/clients/123');

    expect(section?.key).toBe('portfolio');
    expect(section && getActiveNavigationItem(section, '/portfolio/clients/123')?.id).toBe(
      'clients',
    );
  });

  it('filters configured items by permission without changing their IDs', () => {
    const section: NavigationSection = {
      key: 'customers',
      path: '/customers',
      labelKey: 'nav.tab.customers',
      defaultItemId: 'public',
      items: [
        { id: 'public', segment: 'public', labelKey: 'nav.customers.all', icon: TestIcon },
        {
          id: 'restricted',
          segment: 'restricted',
          labelKey: 'nav.customers.all',
          icon: TestIcon,
          requiredPermissions: ['customers:advisors'],
        },
      ],
    };

    expect(getVisibleNavigationItems(section, new Set()).map((item) => item.id)).toEqual([
      'public',
    ]);
    expect(
      getVisibleNavigationItems(section, new Set(['customers:advisors'])).map((item) => item.id),
    ).toEqual(['public', 'restricted']);
  });
});
