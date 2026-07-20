import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getActiveNavigationItem,
  getActiveNavigationSection,
  getNavigationItemPath,
  getVisibleNavigationItems,
} from '@/routes/navigation';
import { MenuList, NavigationIcon, NavigationPanel, cx } from '@/ui';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'scaffold.navigation.sidebar-collapsed';

function readInitialCollapsedState() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Desktop contextual navigation. Visual elements are composed from IWA;
 * this component only connects configuration, the URL and collapse state.
 */
export function ContextualSidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(readInitialCollapsedState);
  const section = getActiveNavigationSection(pathname);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed));
    } catch {
      // Storage can be disabled by browser policy; navigation still works.
    }
  }, [isCollapsed]);

  if (!section) return null;

  const visibleItems = getVisibleNavigationItems(section);
  if (visibleItems.length === 0) return null;

  const activeItem = getActiveNavigationItem(section, pathname);
  const menuItems = visibleItems.map((item) => ({
    id: item.id,
    text: t(item.labelKey),
    icon: <NavigationIcon name={item.iconKey ?? 'default'} />,
  }));
  const toggleLabel = t(isCollapsed ? 'nav.sidebar.expand' : 'nav.sidebar.collapse');

  return (
    <aside
      aria-label={t('nav.title')}
      data-collapsed={isCollapsed}
      className={cx(
        'app-navigation shrink-0 overflow-hidden border-r border-border bg-[var(--navigation-surface)] transition-[width] duration-150 ease-out',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="h-full w-64">
        <NavigationPanel
          title={isCollapsed ? '' : t('nav.title')}
          footer={
            <MenuList
              aria-label={toggleLabel}
              items={[
                {
                  id: 'toggle-sidebar',
                  text: toggleLabel,
                  icon: <NavigationIcon name={isCollapsed ? 'expand' : 'collapse'} />,
                },
              ]}
              buttonClassName="min-h-11 w-full !justify-start !rounded-none px-5 text-left text-sm"
              onItemSelect={() => setIsCollapsed((current) => !current)}
            />
          }
        >
          <MenuList
            aria-label={t('nav.title')}
            items={menuItems}
            selectedId={activeItem?.id}
            buttonClassName="min-h-11 w-full !justify-start !rounded-none px-5 text-left text-sm"
            onItemSelect={(item) => {
              const configuredItem = visibleItems.find((candidate) => candidate.id === item.id);
              if (configuredItem) navigate(getNavigationItemPath(section, configuredItem));
            }}
          />
        </NavigationPanel>
      </div>
    </aside>
  );
}
