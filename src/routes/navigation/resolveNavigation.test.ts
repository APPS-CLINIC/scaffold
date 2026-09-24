import { describe, expect, it } from 'vitest';
import { navigationManifest } from './navigation.manifest';
import type {
  NavigationContextConfig,
  NavigationItemConfig,
  NavigationManifest,
  NavigationTreeItemConfig,
} from './navigation.types';
import { resolveNavigation } from './resolveNavigation';

const TestIcon = () => null;

function toListNavigationItem(item: NavigationTreeItemConfig): NavigationItemConfig {
  return {
    id: item.id,
    segment: item.segment,
    labelKey: item.labelKey,
    icon: item.icon,
    ...(item.match ? { match: item.match } : {}),
    ...(item.requiredPermissions ? { requiredPermissions: item.requiredPermissions } : {}),
  };
}

function mapContextItems(
  manifest: NavigationManifest,
  mapItem: (item: NavigationTreeItemConfig) => NavigationTreeItemConfig,
): NavigationManifest {
  const customers = manifest.sections.find((section) => section.id === 'customers');
  const customerDetail = customers?.context;
  if (!customers || !customerDetail) throw new Error('Expected the customer-detail context.');
  const items: readonly NavigationTreeItemConfig[] = customerDetail.sidebar.items;

  return {
    ...manifest,
    sections: manifest.sections.map((section) =>
      section.id === 'customers'
        ? {
            ...customers,
            context: {
              ...customerDetail,
              sidebar: { type: 'tree', items: items.map(mapItem) },
            },
          }
        : section,
    ),
  };
}

/** The real manifest with one child under Reviews, to exercise nested tree behaviour. */
const nestedManifest = mapContextItems(navigationManifest, (item) =>
  item.id === 'reviews'
    ? {
        ...item,
        children: [
          {
            id: 'review-audit',
            segment: 'audit',
            labelKey: 'nav.portfolio.auditProcess',
            icon: TestIcon,
          },
        ],
      }
    : item,
);

describe('resolveNavigation', () => {
  it('keeps the configured static destination outside entity context', () => {
    const navigation = resolveNavigation('/customers/all');

    expect(navigation.context).toBeNull();
    expect(navigation.section?.id).toBe('customers');
    expect(navigation.sidebar).toMatchObject({
      source: 'global',
      presentation: 'list',
      activeItemId: 'all-customers',
    });
    expect(navigation.route.contextId).toBeNull();
  });

  it('does not claim unsupported descendants of an exact static destination', () => {
    const navigation = resolveNavigation('/customers/all/archived');

    expect(navigation.context).toBeNull();
    expect(navigation.sidebar?.activeItemId).toBeNull();
    expect(navigation.route.unmatchedSegments).toEqual(['all', 'archived']);
  });

  it('automatically gives every owning-section item precedence over a context match', () => {
    const customersSection = navigationManifest.sections.find(
      (section) => section.id === 'customers',
    );

    expect(customersSection).toBeDefined();
    for (const item of customersSection?.sidebar.items ?? []) {
      expect(resolveNavigation(`/customers/${item.segment}/record`).context).toBeNull();
    }
  });

  it.each<{
    pathname: string;
    level: number;
    matchedIds: string[];
    unmatchedSegments: string[];
    manifest?: NavigationManifest;
  }>([
    {
      pathname: '/customers/42',
      level: 1,
      matchedIds: [],
      unmatchedSegments: [],
    },
    {
      pathname: '/customers/42/general-data',
      level: 2,
      matchedIds: ['general-data'],
      unmatchedSegments: [],
    },
    {
      pathname: '/customers/42/general-data/record-7',
      level: 3,
      matchedIds: ['general-data'],
      unmatchedSegments: ['record-7'],
    },
    {
      pathname: '/customers/42/reviews/audit',
      level: 3,
      matchedIds: ['reviews', 'review-audit'],
      unmatchedSegments: [],
      manifest: nestedManifest,
    },
    {
      pathname: '/customers/42/reviews/audit/record-7',
      level: 4,
      matchedIds: ['reviews', 'review-audit'],
      unmatchedSegments: ['record-7'],
      manifest: nestedManifest,
    },
    {
      pathname: '/customers/42/future-tab/record-7',
      level: 3,
      matchedIds: [],
      unmatchedSegments: ['future-tab', 'record-7'],
    },
  ])(
    'resolves context depth, ancestry, and unknown descendants for $pathname',
    ({ pathname, level, matchedIds, unmatchedSegments, manifest = navigationManifest }) => {
      const navigation = resolveNavigation(pathname, manifest);

      expect(navigation.context).toMatchObject({
        id: 'customer-detail',
        parameterName: 'id',
        params: { id: '42' },
        basePath: '/customers/42',
      });
      expect(navigation.route).toMatchObject({
        sectionKey: 'customers',
        contextId: 'customer-detail',
        level,
        matchedItemIds: matchedIds,
        unmatchedSegments,
      });
    },
  );

  it('matches item prefixes only at complete segment boundaries', () => {
    const navigation = resolveNavigation('/customers/42/products-archived/record');

    expect(navigation.route.matchedItemIds).toEqual([]);
    expect(navigation.route.unmatchedSegments).toEqual(['products-archived', 'record']);
    expect(navigation.sidebar?.activeItemId).toBeNull();
  });

  it('decodes an encoded entity id while retaining its encoded canonical base path', () => {
    const navigation = resolveNavigation('/customers/customer%2042/general-data');

    expect(navigation.context?.params).toEqual({ id: 'customer 42' });
    expect(navigation.context?.basePath).toBe('/customers/customer%2042');
    expect(navigation.sidebar?.items.find((item) => item.id === 'general-data')?.path).toBe(
      '/customers/customer%2042/general-data',
    );
  });

  it('keeps a malformed encoded id observable and never throws', () => {
    const navigation = resolveNavigation('/customers/%E0%A4%A/general-data');

    expect(navigation.context?.params).toEqual({ id: '%E0%A4%A' });
    expect(navigation.context?.basePath).toBe('/customers/%E0%A4%A');
    expect(navigation.route.matchedItemIds).toEqual(['general-data']);
  });

  it('normalizes trailing slashes before deriving paths and active state', () => {
    const navigation = resolveNavigation('/customers/42/reviews/audit///', nestedManifest);

    expect(navigation.pathname).toBe('/customers/42/reviews/audit');
    expect(navigation.route.level).toBe(3);
    expect(navigation.route.matchedItemIds).toEqual(['reviews', 'review-audit']);
  });

  it('resolves global top navigation and a contextual tree sidebar independently', () => {
    const navigation = resolveNavigation('/customers/42/reviews/audit/record-7', nestedManifest);

    expect(navigation.topBar).toMatchObject({
      source: 'global',
      activeItemId: 'customers',
    });
    expect(navigation.topBar.items[navigation.topBar.activeIndex]?.id).toBe('customers');
    expect(navigation.sidebar).toMatchObject({
      source: 'context',
      presentation: 'tree',
      activeItemId: 'reviews',
      expandedIds: ['reviews'],
    });
    expect(navigation.sidebar?.activePath.map((item) => item.id)).toEqual([
      'reviews',
      'review-audit',
    ]);
    expect(navigation.sidebar?.activePath.map((item) => item.isActive)).toEqual([true, true]);
    expect(navigation.sidebar?.activePath.map((item) => item.isCurrent)).toEqual([false, true]);
  });

  it('builds a complete breadcrumb model with a replaceable context parameter', () => {
    const navigation = resolveNavigation('/customers/42/reviews/audit/record-7', nestedManifest);

    expect(navigation.breadcrumb.items).toEqual([
      {
        id: 'section-item:all-customers',
        kind: 'message',
        labelKey: 'nav.customers.all',
        path: '/customers/all',
      },
      {
        id: 'context:customer-detail',
        kind: 'parameter',
        parameterName: 'id',
        value: '42',
        path: '/customers/42',
      },
      {
        id: 'context-item:reviews',
        kind: 'message',
        labelKey: 'nav.customerDetail.reviews',
        path: '/customers/42/reviews',
      },
      {
        id: 'context-item:review-audit',
        kind: 'message',
        labelKey: 'nav.portfolio.auditProcess',
        path: '/customers/42/reviews/audit',
      },
      {
        id: 'segment:0:record-7',
        kind: 'segment',
        segment: 'record-7',
        path: '/customers/42/reviews/audit/record-7',
      },
    ]);
  });

  it('supports contextual top navigation and an alternate sidebar presentation', () => {
    const customersSection = nestedManifest.sections.find((section) => section.id === 'customers');
    const customerDetailNavigationContext = customersSection?.context;
    if (!customerDetailNavigationContext) {
      throw new Error('Expected the customer-detail navigation context.');
    }

    const alternateContext: NavigationContextConfig = {
      ...customerDetailNavigationContext,
      topBar: 'context',
      sidebar: {
        type: 'list',
        items: customerDetailNavigationContext.sidebar.items.map(toListNavigationItem),
      },
    };
    const alternateManifest: NavigationManifest = {
      ...nestedManifest,
      sections: nestedManifest.sections.map((section) =>
        section.id === 'customers' ? { ...section, context: alternateContext } : section,
      ),
    };
    const navigation = resolveNavigation('/customers/42/reviews/audit/record-7', alternateManifest);

    expect(navigation.topBar).toMatchObject({
      source: 'context',
      ariaLabelKey: 'nav.customerDetail.navigation',
      activeItemId: 'reviews',
    });
    expect(navigation.topBar.items[navigation.topBar.activeIndex]?.path).toBe(
      '/customers/42/reviews',
    );
    expect(navigation.sidebar).toMatchObject({
      source: 'context',
      presentation: 'list',
      activeItemId: 'reviews',
    });
    expect(navigation.sidebar?.items.map((item) => item.id)).toEqual([
      'dashboard',
      'general-data',
      'cdd-crs-fatca',
      'fm-data',
      'reviews',
      'monitoring',
      'limits',
      'products',
    ]);
    expect(navigation.sidebar?.items.every((item) => item.children.length === 0)).toBe(true);
  });

  it('provides the configured overview fallback for an empty global section', () => {
    const navigation = resolveNavigation('/groups');

    expect(navigation.context).toBeNull();
    expect(navigation.sidebar).toMatchObject({
      source: 'global',
      presentation: 'list',
      activeItemId: 'overview',
    });
    expect(navigation.sidebar?.items).toHaveLength(1);
    expect(navigation.sidebar?.items[0]).toMatchObject({
      id: 'overview',
      path: '/groups',
      isActive: true,
      isCurrent: true,
    });
  });

  it('filters permission-owned items without changing stable route identities', () => {
    const portfolio = navigationManifest.sections.find((section) => section.id === 'portfolio');
    if (!portfolio) throw new Error('Expected the portfolio section.');

    const permissionManifest: NavigationManifest = {
      ...navigationManifest,
      sections: navigationManifest.sections.map((section) =>
        section.id === 'portfolio'
          ? {
              ...portfolio,
              defaultItem: 'public',
              sidebar: {
                ...portfolio.sidebar,
                items: [
                  {
                    id: 'public',
                    segment: 'public',
                    labelKey: 'nav.portfolio.dashboard',
                    icon: TestIcon,
                  },
                  {
                    id: 'restricted',
                    segment: 'restricted',
                    labelKey: 'nav.portfolio.clients',
                    icon: TestIcon,
                    requiredPermissions: ['portfolio:restricted'],
                  },
                ],
              },
            }
          : section,
      ),
    };

    const hidden = resolveNavigation('/portfolio/restricted', permissionManifest, {
      grantedPermissions: new Set(),
    });
    const visible = resolveNavigation('/portfolio/restricted', permissionManifest, {
      grantedPermissions: new Set(['portfolio:restricted']),
    });

    expect(hidden.sidebar?.items.map((item) => item.id)).toEqual(['public']);
    expect(hidden.route.activeItemId).toBeNull();
    expect(visible.sidebar?.items.map((item) => item.id)).toEqual(['public', 'restricted']);
    expect(visible.route.activeItemId).toBe('restricted');
  });
  it('hides a permission-owned context branch together with its permitted descendants', () => {
    const manifest = mapContextItems(nestedManifest, (item) =>
      item.id === 'reviews' ? { ...item, requiredPermissions: ['customers:reviews'] } : item,
    );

    const hidden = resolveNavigation('/customers/42/reviews/audit', manifest, {
      grantedPermissions: new Set(),
    });
    const visible = resolveNavigation('/customers/42/reviews/audit', manifest, {
      grantedPermissions: new Set(['customers:reviews']),
    });

    expect(hidden.sidebar?.items.map((item) => item.id)).not.toContain('reviews');
    expect(hidden.route.matchedItemIds).toEqual([]);
    expect(hidden.route.unmatchedSegments).toEqual(['reviews', 'audit']);
    expect(hidden.breadcrumb.items.map((item) => item.kind)).toEqual([
      'message',
      'parameter',
      'segment',
      'segment',
    ]);

    expect(visible.sidebar?.items.map((item) => item.id)).toContain('reviews');
    expect(visible.route.matchedItemIds).toEqual(['reviews', 'review-audit']);
  });

  it('hides a permission-owned leaf while its permitted parent stays the current item', () => {
    const manifest = mapContextItems(nestedManifest, (item) =>
      item.id === 'reviews'
        ? {
            ...item,
            children: (item.children ?? []).map((child) => ({
              ...child,
              requiredPermissions: ['customers:reviewAudit'],
            })),
          }
        : item,
    );

    const hidden = resolveNavigation('/customers/42/reviews/audit', manifest, {
      grantedPermissions: new Set(),
    });

    expect(hidden.sidebar?.items.find((item) => item.id === 'reviews')?.children).toEqual([]);
    expect(hidden.sidebar?.expandedIds).toEqual([]);
    expect(hidden.route.matchedItemIds).toEqual(['reviews']);
    expect(hidden.route.unmatchedSegments).toEqual(['audit']);
    expect(hidden.breadcrumb.items.at(-1)).toMatchObject({ kind: 'segment', segment: 'audit' });
  });

  it('keeps permission-owned items visible when no permission set is supplied', () => {
    const manifest = mapContextItems(nestedManifest, (item) =>
      item.id === 'reviews' ? { ...item, requiredPermissions: ['customers:reviews'] } : item,
    );

    const navigation = resolveNavigation('/customers/42/reviews/audit', manifest);

    expect(navigation.sidebar?.items.map((item) => item.id)).toContain('reviews');
    expect(navigation.route.matchedItemIds).toEqual(['reviews', 'review-audit']);
  });
});
