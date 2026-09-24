import { describe, expect, it } from 'vitest';
import {
  getNavigationContextDefaultItemPath,
  getNavigationItemPath,
  getNavigationSectionDefaultPath,
  navigationManifest,
  type NavigationSidebarConfig,
  type NavigationTreeItemConfig,
} from './index';

const navigationSections = navigationManifest.sections;

function flattenItems(
  items: readonly NavigationTreeItemConfig[],
): readonly NavigationTreeItemConfig[] {
  return items.flatMap((item) => [item, ...flattenItems(item.children ?? [])]);
}

describe('navigation configuration', () => {
  it('keeps section keys and every generated route unique', () => {
    const sectionKeys = navigationSections.map((section) => section.id);
    const paths = navigationSections.flatMap((section) => [
      section.path,
      ...section.sidebar.items.map((item) => getNavigationItemPath(section, item)),
    ]);

    expect(new Set(sectionKeys).size).toBe(sectionKeys.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps each default item inside its own section', () => {
    for (const section of navigationSections) {
      if (!('defaultItem' in section)) continue;
      expect(section.sidebar.items.some((item) => item.id === section.defaultItem)).toBe(true);
    }
  });

  it('derives default destinations without duplicating full item paths', () => {
    const portfolio = navigationSections.find((section) => section.id === 'portfolio');
    const customers = navigationSections.find((section) => section.id === 'customers');

    expect(portfolio && getNavigationSectionDefaultPath(portfolio)).toBe('/portfolio/dashboard');
    expect(customers && getNavigationSectionDefaultPath(customers)).toBe('/customers/all');
  });

  it('keeps configured IWA icon components on contextual items', () => {
    const portfolio = navigationSections.find((section) => section.id === 'portfolio');

    expect(portfolio?.sidebar.items.every((item) => item.icon)).toBe(true);
  });

  it('keeps list sidebar items flat in both the type and runtime contracts', () => {
    type ListSidebar = Extract<NavigationSidebarConfig, { type: 'list' }>;
    type TreeItemIsRejected = NavigationTreeItemConfig extends ListSidebar['items'][number]
      ? false
      : true;
    const treeItemIsRejected: TreeItemIsRejected = true;
    const listSidebars = navigationSections
      .map((section) => section.sidebar)
      .filter((sidebar) => sidebar.type === 'list');

    expect(treeItemIsRejected).toBe(true);
    expect(
      listSidebars.every((sidebar) => sidebar.items.every((item) => !('children' in item))),
    ).toBe(true);
  });

  it('declares every customer destination and English segment in one context tree', () => {
    const customers = navigationSections.find((section) => section.id === 'customers');
    const customerContext = customers?.context;

    expect(customerContext?.sidebar.items.map((item) => item.id)).toEqual([
      'dashboard',
      'general-data',
      'cdd-crs-fatca',
      'fm-data',
      'reviews',
      'monitoring',
      'limits',
      'products',
    ]);
    expect(customerContext?.sidebar.items.map((item) => item.segment)).toEqual([
      'dashboard',
      'general-data',
      'cdd-crs-fatca',
      'fm-data',
      'reviews',
      'monitoring',
      'limits',
      'products',
    ]);
    expect(
      customerContext?.sidebar.items.find((item) => item.id === 'reviews')?.children?.[0]?.segment,
    ).toBe('details');
    expect(customerContext?.defaultItem).toBe('general-data');
    expect(customerContext && getNavigationContextDefaultItemPath(customerContext)).toBe(
      'general-data',
    );
  });

  it('derives a context default path from any configured tree depth', () => {
    const customers = navigationSections.find((section) => section.id === 'customers');
    const customerContext = customers?.context;
    if (!customerContext) throw new Error('Expected the customer-detail context.');

    expect(
      getNavigationContextDefaultItemPath({
        ...customerContext,
        defaultItem: 'review-details',
      }),
    ).toBe('reviews/details');
    expect(
      getNavigationContextDefaultItemPath({
        ...customerContext,
        defaultItem: 'missing-item',
      }),
    ).toBeNull();
  });

  it('keeps context identities, item identities, and sibling segments unambiguous', () => {
    const contexts = navigationSections.flatMap((section) =>
      'context' in section ? [section.context] : [],
    );
    const contextIds = contexts.map((context) => context.id);
    expect(new Set(contextIds).size).toBe(contextIds.length);

    for (const section of navigationSections) {
      if (!('context' in section)) continue;

      const context = section.context;
      const allItems = flattenItems(context.sidebar.items);
      const rootBreadcrumbItem = context.breadcrumb?.rootItem
        ? section.sidebar.items.find((item) => item.id === context.breadcrumb?.rootItem)
        : undefined;

      expect(new Set(allItems.map((item) => item.id)).size).toBe(allItems.length);
      if (context.defaultItem) {
        expect(allItems.some((item) => item.id === context.defaultItem)).toBe(true);
      }
      if (context.breadcrumb?.rootItem) expect(rootBreadcrumbItem).toBeDefined();

      const assertUniqueSiblingSegments = (items: readonly NavigationTreeItemConfig[]) => {
        expect(new Set(items.map((item) => item.segment)).size).toBe(items.length);
        items.forEach((item) => assertUniqueSiblingSegments(item.children ?? []));
      };
      assertUniqueSiblingSegments(context.sidebar.items);
    }
  });
});
