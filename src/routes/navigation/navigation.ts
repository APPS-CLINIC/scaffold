import {
  defaultNavigationItem,
  navigationSections,
  type ConfiguredNavigationItem,
  type NavigationItemConfig,
  type NavigationSection,
  type NavigationSectionKey,
} from './navigation.config';

export const defaultNavigationSectionKey: NavigationSectionKey = 'home';

export function getNavigationItemPath(
  section: Pick<NavigationSection, 'path'>,
  item: Pick<NavigationItemConfig, 'segment'>,
) {
  if (!item.segment) return section.path;
  return `${section.path === '/' ? '' : section.path}/${item.segment}`;
}

export function getNavigationSectionByKey(key: NavigationSectionKey) {
  return navigationSections.find((section) => section.key === key);
}

export function getNavigationSectionDefaultPath(section: NavigationSection) {
  if (!section.defaultItemId) return section.path;

  const defaultItem = section.items.find((item) => item.id === section.defaultItemId);
  return defaultItem ? getNavigationItemPath(section, defaultItem) : section.path;
}

export function getActiveNavigationSection(pathname: string) {
  return navigationSections.find(
    (section) =>
      section.path === pathname ||
      (section.path !== '/' && pathname.startsWith(`${section.path}/`)),
  );
}

function matchesNavigationItem(
  section: NavigationSection,
  item: ConfiguredNavigationItem,
  pathname: string,
) {
  const itemPath = getNavigationItemPath(section, item);
  return item.match === 'exact'
    ? pathname === itemPath
    : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function getActiveNavigationItem(section: NavigationSection, pathname: string) {
  return getContextualNavigationItems(section).find((item) =>
    matchesNavigationItem(section, item, pathname),
  );
}

export function getVisibleNavigationItems(
  section: NavigationSection,
  grantedPermissions?: ReadonlySet<string>,
) {
  return section.items.filter((item) => {
    if (!item.requiredPermissions?.length || !grantedPermissions) return true;
    return item.requiredPermissions.every((permission) => grantedPermissions.has(permission));
  });
}

export function getContextualNavigationItems(
  section: NavigationSection,
  grantedPermissions?: ReadonlySet<string>,
) {
  const visibleItems = getVisibleNavigationItems(section, grantedPermissions);
  return visibleItems.length > 0 ? visibleItems : [defaultNavigationItem];
}
