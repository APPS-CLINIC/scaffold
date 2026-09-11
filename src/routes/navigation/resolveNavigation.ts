import { navigationManifest, type NavigationSectionKey } from './navigation.manifest';
import type {
  NavigationContextConfig,
  NavigationItemConfig,
  NavigationManifest,
  NavigationSectionConfig,
  NavigationSidebarConfig,
  NavigationTreeItemConfig,
  ResolvedBreadcrumbItem,
  ResolvedNavigation,
  ResolvedNavigationContext,
  ResolvedNavigationNode,
  ResolvedNavigationSurfaceItem,
  ResolvedSidebarNavigation,
  ResolvedTopNavigation,
} from './navigation.types';

export interface ResolveNavigationOptions {
  grantedPermissions?: ReadonlySet<string>;
}

interface ResolvedContextMatch {
  config: NavigationContextConfig;
  context: ResolvedNavigationContext;
  routeSegments: readonly string[];
}

interface ResolvedTree {
  items: readonly ResolvedNavigationNode[];
  activePath: readonly ResolvedNavigationNode[];
}

function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/u, 1)[0] || '/';
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withLeadingSlash === '/' ? withLeadingSlash : withLeadingSlash.replace(/\/+$/u, '');
}

function splitPath(pathname: string): readonly string[] {
  return pathname.split('/').filter(Boolean);
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function appendPath(basePath: string, segment: string): string {
  if (!segment) return basePath;
  return `${basePath === '/' ? '' : basePath}/${segment}`;
}

function matchesPathPrefix(basePath: string, pathname: string): boolean {
  return pathname === basePath || (basePath !== '/' && pathname.startsWith(`${basePath}/`));
}

export function getNavigationItemPath(
  section: Pick<NavigationSectionConfig, 'path'>,
  item: Pick<NavigationItemConfig, 'segment'>,
): string {
  return appendPath(section.path, item.segment);
}

function findNavigationItemSegments(
  items: readonly NavigationTreeItemConfig[],
  itemId: string,
): readonly string[] | null {
  for (const item of items) {
    if (item.id === itemId) return item.segment ? [item.segment] : [];

    const childSegments = findNavigationItemSegments(item.children ?? [], itemId);
    if (childSegments) {
      return item.segment ? [item.segment, ...childSegments] : childSegments;
    }
  }

  return null;
}

/** Returns the configured default destination relative to the context route. */
export function getNavigationContextDefaultItemPath(
  context: NavigationContextConfig,
): string | null {
  if (!context.defaultItem) return null;

  const segments = findNavigationItemSegments(context.sidebar.items, context.defaultItem);
  return segments?.join('/') ?? null;
}

export function getNavigationSectionDefaultPath(section: NavigationSectionConfig): string {
  if (!section.defaultItem) return section.path;

  const defaultItem = section.sidebar.items.find((item) => item.id === section.defaultItem);
  return defaultItem ? getNavigationItemPath(section, defaultItem) : section.path;
}

function findSection(
  pathname: string,
  manifest: NavigationManifest,
): NavigationSectionConfig | null {
  return (
    [...manifest.sections]
      .sort((left, right) => right.path.length - left.path.length)
      .find((section) => matchesPathPrefix(section.path, pathname)) ?? null
  );
}

function getSectionById(
  manifest: NavigationManifest,
  sectionId: string,
): NavigationSectionConfig | null {
  return manifest.sections.find((section) => section.id === sectionId) ?? null;
}

function isVisible(
  item: Pick<NavigationItemConfig, 'requiredPermissions'>,
  grantedPermissions?: ReadonlySet<string>,
): boolean {
  if (!item.requiredPermissions?.length || !grantedPermissions) return true;
  return item.requiredPermissions.every((permission) => grantedPermissions.has(permission));
}

function getVisibleItems<TItem extends Pick<NavigationItemConfig, 'requiredPermissions'>>(
  items: readonly TItem[],
  options: ResolveNavigationOptions,
): readonly TItem[] {
  return items.filter((item) => isVisible(item, options.grantedPermissions));
}

function resolveList(
  items: readonly NavigationItemConfig[],
  basePath: string,
  pathSegments: readonly string[],
  options: ResolveNavigationOptions,
): ResolvedTree {
  const visibleItems = getVisibleItems(items, options);
  const currentSegment = decodePathSegment(pathSegments[0] ?? '');
  const activeItem = visibleItems.find(
    (item) =>
      item.segment === currentSegment && !(item.match === 'exact' && pathSegments.length > 1),
  );
  const resolvedItems = visibleItems.map((item): ResolvedNavigationNode => ({
    id: item.id,
    labelKey: item.labelKey,
    icon: item.icon,
    path: appendPath(basePath, item.segment),
    children: [],
    isActive: item === activeItem,
    isCurrent: item === activeItem,
  }));

  return {
    items: resolvedItems,
    activePath: activeItem
      ? resolvedItems.filter((item) => item.id === activeItem.id).slice(0, 1)
      : [],
  };
}

function findActiveConfigPath(
  items: readonly NavigationTreeItemConfig[],
  pathSegments: readonly string[],
  options: ResolveNavigationOptions,
): readonly NavigationTreeItemConfig[] {
  const visibleItems = getVisibleItems(items, options);

  if (pathSegments.length === 0) {
    const rootItem = visibleItems.find((item) => item.segment === '');
    return rootItem ? [rootItem] : [];
  }

  const currentSegment = decodePathSegment(pathSegments[0] ?? '');
  const item = visibleItems.find((candidate) => candidate.segment === currentSegment);
  if (!item || (item.match === 'exact' && pathSegments.length > 1)) return [];

  const childPath = findActiveConfigPath(item.children ?? [], pathSegments.slice(1), options);
  return childPath.length > 0 ? [item, ...childPath] : [item];
}

function resolveTree(
  items: readonly NavigationTreeItemConfig[],
  basePath: string,
  pathSegments: readonly string[],
  options: ResolveNavigationOptions,
): ResolvedTree {
  const visibleItems = getVisibleItems(items, options);
  const activeConfigPath = findActiveConfigPath(visibleItems, pathSegments, options);
  const activeItems = new Set(activeConfigPath);
  const currentItem = activeConfigPath.at(-1);
  const resolvedByConfig = new Map<NavigationTreeItemConfig, ResolvedNavigationNode>();

  const buildNodes = (
    configuredItems: readonly NavigationTreeItemConfig[],
    parentPath: string,
  ): readonly ResolvedNavigationNode[] =>
    configuredItems
      .filter((item) => isVisible(item, options.grantedPermissions))
      .map((item) => {
        const path = appendPath(parentPath, item.segment);
        const node: ResolvedNavigationNode = {
          id: item.id,
          labelKey: item.labelKey,
          icon: item.icon,
          path,
          children: buildNodes(item.children ?? [], path),
          isActive: activeItems.has(item),
          isCurrent: currentItem === item,
        };
        resolvedByConfig.set(item, node);
        return node;
      });

  const resolvedItems = buildNodes(visibleItems, basePath);

  return {
    items: resolvedItems,
    activePath: activeConfigPath.flatMap((item) => {
      const resolvedItem = resolvedByConfig.get(item);
      return resolvedItem ? [resolvedItem] : [];
    }),
  };
}

function resolveSidebarItems(
  sidebar: NavigationSidebarConfig,
  basePath: string,
  pathSegments: readonly string[],
  options: ResolveNavigationOptions,
): ResolvedTree {
  return sidebar.type === 'tree'
    ? resolveTree(sidebar.items, basePath, pathSegments, options)
    : resolveList(sidebar.items, basePath, pathSegments, options);
}

function getSectionRouteSegments(
  section: NavigationSectionConfig,
  pathname: string,
): readonly string[] {
  const sectionSegmentCount = splitPath(section.path).length;
  return splitPath(pathname).slice(sectionSegmentCount);
}

function resolveContextMatch(
  section: NavigationSectionConfig,
  pathname: string,
): ResolvedContextMatch | null {
  const sectionRouteSegments = getSectionRouteSegments(section, pathname);
  const encodedParameter = sectionRouteSegments[0];
  if (!encodedParameter) return null;

  const decodedParameter = decodePathSegment(encodedParameter);
  const isStaticSectionItem = section.sidebar.items.some(
    (item) => item.segment === decodedParameter,
  );
  if (isStaticSectionItem) return null;

  const contextConfig = section.context;
  if (!contextConfig) return null;

  return {
    config: contextConfig,
    context: {
      id: contextConfig.id,
      parameterName: contextConfig.parameter,
      params: { [contextConfig.parameter]: decodedParameter },
      basePath: appendPath(section.path, encodedParameter),
    },
    routeSegments: sectionRouteSegments.slice(1),
  };
}

function resolveGlobalTopBar(
  activeSection: NavigationSectionConfig | null,
  manifest: NavigationManifest,
): ResolvedTopNavigation {
  const activeSectionId = activeSection?.id ?? manifest.defaultSection;
  const items: readonly ResolvedNavigationSurfaceItem[] = manifest.sections.map((section) => ({
    id: section.id,
    labelKey: section.labelKey,
    path: getNavigationSectionDefaultPath(section),
  }));

  return {
    source: 'global',
    navigationKey: `global:${activeSectionId}`,
    ariaLabelKey: 'nav.title',
    items,
    activeItemId: activeSectionId,
    activeIndex: items.findIndex((item) => item.id === activeSectionId),
  };
}

function resolveContextTopBar(
  contextConfig: NavigationContextConfig,
  context: ResolvedNavigationContext,
  contextTree: ResolvedTree,
): ResolvedTopNavigation {
  const activeItemId = contextTree.activePath[0]?.id ?? null;
  const items = contextTree.items.map((item) => ({
    id: item.id,
    labelKey: item.labelKey,
    path: item.path,
  }));

  return {
    source: 'context',
    navigationKey: `context:${contextConfig.id}:${context.params[context.parameterName] ?? ''}`,
    ariaLabelKey: contextConfig.ariaLabelKey,
    items,
    activeItemId,
    activeIndex: items.findIndex((item) => item.id === activeItemId),
  };
}

function resolveGlobalSidebar(
  section: NavigationSectionConfig,
  pathname: string,
  manifest: NavigationManifest,
  options: ResolveNavigationOptions,
): ResolvedSidebarNavigation {
  const pathSegments = matchesPathPrefix(section.path, pathname)
    ? getSectionRouteSegments(section, pathname)
    : [];
  const tree =
    section.sidebar.items.length > 0
      ? resolveSidebarItems(section.sidebar, section.path, pathSegments, options)
      : resolveList([manifest.fallbackItem], section.path, pathSegments, options);

  return {
    source: 'global',
    presentation: section.sidebar.type,
    navigationKey: `global:${section.id}`,
    ariaLabelKey: 'nav.title',
    items: tree.items,
    activePath: tree.activePath,
    activeItemId: tree.activePath[0]?.id ?? null,
    expandedIds: tree.activePath.filter((item) => item.children.length > 0).map((item) => item.id),
  };
}

function resolveContextSidebar(
  contextConfig: NavigationContextConfig,
  context: ResolvedNavigationContext,
  tree: ResolvedTree,
): ResolvedSidebarNavigation {
  return {
    source: 'context',
    presentation: contextConfig.sidebar.type,
    navigationKey: `context:${contextConfig.id}:${context.params[context.parameterName] ?? ''}`,
    ariaLabelKey: contextConfig.ariaLabelKey,
    items: tree.items,
    activePath: tree.activePath,
    activeItemId: tree.activePath[0]?.id ?? null,
    expandedIds: tree.activePath.filter((item) => item.children.length > 0).map((item) => item.id),
  };
}

function resolveBreadcrumb(
  section: NavigationSectionConfig,
  contextMatch: ResolvedContextMatch,
  contextTree: ResolvedTree,
  unmatchedSegments: readonly string[],
): readonly ResolvedBreadcrumbItem[] {
  const { config, context } = contextMatch;
  const items: ResolvedBreadcrumbItem[] = [];
  const rootItem = config.breadcrumb?.rootItem
    ? section.sidebar.items.find((item) => item.id === config.breadcrumb?.rootItem)
    : undefined;

  if (rootItem) {
    items.push({
      id: `section-item:${rootItem.id}`,
      kind: 'message',
      labelKey: rootItem.labelKey,
      path: appendPath(section.path, rootItem.segment),
    });
  }

  items.push({
    id: `context:${config.id}`,
    kind: 'parameter',
    parameterName: context.parameterName,
    value: context.params[context.parameterName] ?? '',
    path: context.basePath,
  });

  for (const item of contextTree.activePath) {
    items.push({
      id: `context-item:${item.id}`,
      kind: 'message',
      labelKey: item.labelKey,
      path: item.path,
    });
  }

  let unmatchedPath = contextTree.activePath.at(-1)?.path ?? context.basePath;
  unmatchedSegments.forEach((segment, index) => {
    unmatchedPath = appendPath(unmatchedPath, segment);
    items.push({
      id: `segment:${index}:${segment}`,
      kind: 'segment',
      segment,
      path: unmatchedPath,
    });
  });

  return items;
}

/**
 * Resolves a pathname into complete, presentation-ready navigation models.
 * Components consume this result and never need domain-specific path tests.
 */
export function resolveNavigation(
  pathname: string,
  manifest?: typeof navigationManifest,
  options?: ResolveNavigationOptions,
): ResolvedNavigation<NavigationSectionKey>;
export function resolveNavigation<const TManifest extends NavigationManifest>(
  pathname: string,
  manifest: TManifest,
  options?: ResolveNavigationOptions,
): ResolvedNavigation<TManifest['sections'][number]['id']>;
export function resolveNavigation(
  pathname: string,
  manifest: NavigationManifest = navigationManifest,
  options: ResolveNavigationOptions = {},
): ResolvedNavigation {
  const normalizedPathname = normalizePathname(pathname);
  const section = findSection(normalizedPathname, manifest);
  const fallbackSection = getSectionById(manifest, manifest.defaultSection);
  const routeSection = section ?? fallbackSection;
  const topBar = resolveGlobalTopBar(section, manifest);

  if (!routeSection) {
    throw new Error('Navigation manifest must contain its default section.');
  }

  if (!section) {
    return {
      pathname: normalizedPathname,
      section: null,
      context: null,
      topBar,
      sidebar: null,
      route: {
        sectionKey: routeSection.id,
        contextId: null,
        params: {},
        level: 0,
        segments: splitPath(normalizedPathname),
        matchedPath: routeSection.path,
        activePath: [],
        matchedItemIds: [],
        activeItemId: null,
        unmatchedSegments: splitPath(normalizedPathname),
      },
      breadcrumb: { items: [] },
    };
  }

  const contextMatch = resolveContextMatch(section, normalizedPathname);
  if (!contextMatch) {
    const sidebar = resolveGlobalSidebar(section, normalizedPathname, manifest, options);
    const sectionSegments = getSectionRouteSegments(section, normalizedPathname);
    const matchedSegmentCount = sidebar.activePath.filter(
      (item) => item.path !== section.path,
    ).length;

    return {
      pathname: normalizedPathname,
      section,
      context: null,
      topBar,
      sidebar,
      route: {
        sectionKey: section.id,
        contextId: null,
        params: {},
        level: 0,
        segments: sectionSegments,
        matchedPath: sidebar.activePath.at(-1)?.path ?? section.path,
        activePath: sidebar.activePath,
        matchedItemIds: sidebar.activePath.map((item) => item.id),
        activeItemId: sidebar.activeItemId,
        unmatchedSegments: sectionSegments.slice(matchedSegmentCount),
      },
      breadcrumb: { items: [] },
    };
  }

  const contextTree = resolveSidebarItems(
    contextMatch.config.sidebar,
    contextMatch.context.basePath,
    contextMatch.routeSegments,
    options,
  );
  const matchedSegmentCount = contextTree.activePath.length;
  const unmatchedSegments = contextMatch.routeSegments.slice(matchedSegmentCount);
  const resolvedTopBar =
    contextMatch.config.topBar === 'context'
      ? resolveContextTopBar(contextMatch.config, contextMatch.context, contextTree)
      : topBar;
  const sidebar = resolveContextSidebar(contextMatch.config, contextMatch.context, contextTree);

  return {
    pathname: normalizedPathname,
    section,
    context: contextMatch.context,
    topBar: resolvedTopBar,
    sidebar,
    route: {
      sectionKey: section.id,
      contextId: contextMatch.config.id,
      params: contextMatch.context.params,
      level: 1 + contextMatch.routeSegments.length,
      segments: contextMatch.routeSegments,
      matchedPath: contextTree.activePath.at(-1)?.path ?? contextMatch.context.basePath,
      activePath: contextTree.activePath,
      matchedItemIds: contextTree.activePath.map((item) => item.id),
      activeItemId: contextTree.activePath[0]?.id ?? null,
      unmatchedSegments,
    },
    breadcrumb: {
      items: resolveBreadcrumb(section, contextMatch, contextTree, unmatchedSegments),
    },
  };
}
