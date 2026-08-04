import { useEffect, useState } from 'react';
import { Hide } from 'ing-react-icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getActiveNavigationItem,
  getActiveNavigationSection,
  getContextualNavigationItems,
  getNavigationItemPath,
} from '@/routes/navigation';
import { MenuListAdapter, NavigationIcon, NavigationPanel, cx } from '@/ui';

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

  const visibleItems = getContextualNavigationItems(section);

  const activeItem = getActiveNavigationItem(section, pathname);
  const menuItems = visibleItems.map((item) => ({
    id: item.id,
    text: isCollapsed ? '' : t(item.labelKey),
    icon: item.icon ? (
      <NavigationIcon
        icon={item.icon}
        {...(isCollapsed
          ? { role: 'img', 'aria-hidden': false, 'aria-label': t(item.labelKey) }
          : {})}
      />
    ) : undefined,
  }));
  const toggleLabel = t(isCollapsed ? 'nav.sidebar.expand' : 'nav.sidebar.collapse');
  const menuButtonClassName = cx(
    'min-h-11 w-full !rounded-none text-left text-sm',
    isCollapsed ? '!justify-center px-0' : '!justify-start px-5',
  );

  return (
    <aside
      aria-label={t('nav.title')}
      data-collapsed={isCollapsed}
      className={cx(
        'app-navigation shrink-0 overflow-hidden border-r border-border bg-[var(--navigation-surface)] transition-[width] duration-150 ease-out',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={cx('h-full', isCollapsed ? 'w-16' : 'w-64')}>
        <NavigationPanel
          title={isCollapsed ? '' : t('nav.title')}
          headerAction={
            <MenuListAdapter
              aria-label={toggleLabel}
              items={[
                {
                  id: 'toggle-sidebar',
                  text: '',
                  icon: (
                    <NavigationIcon
                      icon={Hide}
                      role="img"
                      aria-hidden={false}
                      aria-label={toggleLabel}
                    />
                  ),
                },
              ]}
              buttonClassName="min-h-11 w-full !justify-center !rounded-none px-0 text-sm"
              onItemSelect={() => setIsCollapsed((current) => !current)}
            />
          }
        >
          <MenuListAdapter
            key={`${section.key}:${isCollapsed ? 'icons' : 'labels'}`}
            aria-label={t('nav.title')}
            items={menuItems}
            selectedId={activeItem?.id}
            buttonClassName={menuButtonClassName}
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
