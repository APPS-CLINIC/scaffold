import { useEffect, useState } from 'react';
import { Hide } from 'ing-react-icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveNavigation } from '@/routes/navigation';
import { MenuListAdapter, NavigationIcon, NavigationPanel, twMerge } from '@/ui';
import { NavigationTree } from './NavigationTree';

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
  const sidebar = resolveNavigation(pathname).sidebar;

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed));
    } catch {
      // Storage can be disabled by browser policy; navigation still works.
    }
  }, [isCollapsed]);

  if (!sidebar) return null;

  const menuItems = sidebar.items.map((item) => ({
    id: item.id,
    text: isCollapsed ? '' : t(item.labelKey),
    icon: (
      <NavigationIcon
        icon={item.icon}
        {...(isCollapsed
          ? {
              role: 'img',
              'aria-hidden': false,
              'aria-label': t(item.labelKey),
              title: t(item.labelKey),
            }
          : {})}
      />
    ),
  }));
  const sidebarLabel = t(sidebar.ariaLabelKey);
  const sidebarTitle = t('nav.title');
  const toggleLabel = t(isCollapsed ? 'nav.sidebar.expand' : 'nav.sidebar.collapse');
  const menuButtonClassName = twMerge(
    'min-h-11 w-full !rounded-none text-left',
    isCollapsed ? '!justify-center px-0 text-sm' : '!justify-start px-5 text-sm',
  );

  return (
    <aside
      aria-label={sidebarLabel}
      data-collapsed={isCollapsed}
      className={twMerge(
        'app-navigation hidden min-h-0 shrink-0 overflow-hidden border-r border-border bg-[var(--navigation-surface)] transition-[width] duration-150 ease-out motion-reduce:transition-none md:flex',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={twMerge('h-full min-h-0', isCollapsed ? 'w-16' : 'w-64')}>
        <NavigationPanel
          title={isCollapsed ? '' : sidebarTitle}
          headerAction={
            <button
              type="button"
              aria-label={toggleLabel}
              aria-controls="app-contextual-navigation-items"
              aria-expanded={!isCollapsed}
              title={toggleLabel}
              onClick={() => setIsCollapsed((current) => !current)}
              className="inline-flex min-h-11 w-full items-center justify-center px-0 text-sm"
            >
              <NavigationIcon icon={Hide} />
            </button>
          }
        >
          <div id="app-contextual-navigation-items">
            {sidebar.presentation === 'tree' ? (
              <NavigationTree
                key={sidebar.navigationKey}
                items={sidebar.items}
                expandedIds={sidebar.expandedIds}
                isCollapsed={isCollapsed}
              />
            ) : (
              <MenuListAdapter
                key={`${sidebar.navigationKey}:${isCollapsed ? 'icons' : 'labels'}`}
                aria-label={sidebarLabel}
                items={menuItems}
                selectedId={sidebar.activeItemId ?? undefined}
                buttonClassName={menuButtonClassName}
                onItemSelect={(item) => {
                  const resolvedItem = sidebar.items.find((candidate) => candidate.id === item.id);
                  if (resolvedItem) navigate(resolvedItem.path);
                }}
              />
            )}
          </div>
        </NavigationPanel>
      </div>
    </aside>
  );
}
