import { describe, expect, it } from 'vitest';
import {
  getActiveNavigationItem,
  getActiveNavigationSection,
  getNavigationItemPath,
  getNavigationSectionDefaultPath,
  getVisibleNavigationItems,
  navigationSections,
  type NavigationSection,
} from './index';

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
    const clients = navigationSections.find((section) => section.key === 'clients');

    expect(portfolio && getNavigationSectionDefaultPath(portfolio)).toBe('/portfolio/dashboard');
    expect(clients && getNavigationSectionDefaultPath(clients)).toBe('/clients/all');
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
      key: 'clients',
      path: '/clients',
      labelKey: 'nav.tab.clients',
      defaultItemId: 'public',
      items: [
        { id: 'public', segment: 'public', labelKey: 'nav.clients.all' },
        {
          id: 'restricted',
          segment: 'restricted',
          labelKey: 'nav.clients.advisors',
          requiredPermissions: ['clients:advisors'],
        },
      ],
    };

    expect(getVisibleNavigationItems(section, new Set()).map((item) => item.id)).toEqual([
      'public',
    ]);
    expect(
      getVisibleNavigationItems(section, new Set(['clients:advisors'])).map((item) => item.id),
    ).toEqual(['public', 'restricted']);
  });
});
