import type { ComponentType } from 'react';
import type { MessageKey } from '@/i18n/messages/pl';

export type NavigationIconComponent = ComponentType<{ className?: string }>;
export type NavigationMatchMode = 'exact' | 'prefix';
export type NavigationTopBarMode = 'global' | 'context';

interface NavigationItemBaseConfig {
  id: string;
  segment: string;
  labelKey: MessageKey;
  icon: NavigationIconComponent;
  match?: NavigationMatchMode;
  requiredPermissions?: readonly string[];
}

export interface NavigationItemConfig extends NavigationItemBaseConfig {
  children?: never;
}

export interface NavigationTreeItemConfig extends NavigationItemBaseConfig {
  children?: readonly NavigationTreeItemConfig[];
}

export type NavigationSidebarConfig =
  | {
      type: 'list';
      items: readonly NavigationItemConfig[];
    }
  | {
      type: 'tree';
      items: readonly NavigationTreeItemConfig[];
    };

export type NavigationSidebarType = NavigationSidebarConfig['type'];

export interface NavigationContextConfig {
  id: string;
  parameter: string;
  ariaLabelKey: MessageKey;
  topBar: NavigationTopBarMode;
  defaultItem?: string;
  sidebar: NavigationSidebarConfig;
  breadcrumb?: {
    rootItem?: string;
  };
}

export interface NavigationSectionConfig {
  id: string;
  path: `/${string}`;
  labelKey: MessageKey;
  defaultItem?: string;
  sidebar: NavigationSidebarConfig;
  context?: NavigationContextConfig;
}

export interface NavigationManifest {
  defaultSection: string;
  fallbackItem: NavigationItemConfig;
  sections: readonly NavigationSectionConfig[];
}

export interface ResolvedNavigationNode {
  id: string;
  labelKey: MessageKey;
  icon: NavigationIconComponent;
  path: string;
  children: readonly ResolvedNavigationNode[];
  isActive: boolean;
  isCurrent: boolean;
}

export interface ResolvedNavigationContext {
  id: string;
  parameterName: string;
  params: Readonly<Record<string, string>>;
  basePath: string;
}

export interface ResolvedNavigationSurfaceItem {
  id: string;
  labelKey: MessageKey;
  path: string;
}

export interface ResolvedTopNavigation {
  source: NavigationTopBarMode;
  navigationKey: string;
  ariaLabelKey: MessageKey;
  items: readonly ResolvedNavigationSurfaceItem[];
  activeItemId: string | null;
  activeIndex: number;
}

export interface ResolvedSidebarNavigation {
  source: 'global' | 'context';
  presentation: NavigationSidebarType;
  navigationKey: string;
  ariaLabelKey: MessageKey;
  items: readonly ResolvedNavigationNode[];
  activePath: readonly ResolvedNavigationNode[];
  activeItemId: string | null;
  expandedIds: readonly string[];
}

export interface ResolvedNavigationRoute<TSectionId extends string = string> {
  sectionKey: TSectionId;
  contextId: string | null;
  params: Readonly<Record<string, string>>;
  level: number;
  segments: readonly string[];
  matchedPath: string;
  activePath: readonly ResolvedNavigationNode[];
  matchedItemIds: readonly string[];
  activeItemId: string | null;
  unmatchedSegments: readonly string[];
}

export type ResolvedBreadcrumbItem =
  | {
      id: string;
      kind: 'message';
      labelKey: MessageKey;
      path: string;
    }
  | {
      id: string;
      kind: 'parameter';
      parameterName: string;
      value: string;
      path: string;
    }
  | {
      id: string;
      kind: 'segment';
      segment: string;
      path: string;
    };

export interface ResolvedNavigation<TSectionId extends string = string> {
  pathname: string;
  section: NavigationSectionConfig | null;
  context: ResolvedNavigationContext | null;
  topBar: ResolvedTopNavigation;
  sidebar: ResolvedSidebarNavigation | null;
  route: ResolvedNavigationRoute<TSectionId>;
  breadcrumb: {
    items: readonly ResolvedBreadcrumbItem[];
  };
}
