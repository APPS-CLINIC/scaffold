import type { SetStateAction } from 'react';
import { TabMenu, TopBar } from '@/ui';
import { Hide, Logout, Settings } from 'ing-react-icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectPathname } from '@/features/urlState/urlState.selectors';
import { resolveNavigation } from '@/routes/navigation';
import { Logo } from '@/components/Logo';

/**
 * Top bar with the primary tab navigation (IWA TopBar + TabMenu).
 *
 * The active tab is not local state: clicking a tab only navigates, and the
 * URL remains the source of truth. A pure route resolver applies the declared
 * navigation policy and gives this component one render model for global and
 * contextual modes. Deep links, back/forward and programmatic navigation
 * therefore reconstruct the same state without policy branches in JSX.
 */
export const TopBarCustom = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useAppSelector(selectPathname);
  const topNavigation = resolveNavigation(pathname).topBar;

  return (
    <TopBar
      className="px-6 py-2"
      logo={<Logo />}
      onLogoClick={() => navigate('/')}
      items={[
        // TODO: swap in the proper ing-react-icons glyphs (only the names
        // confirmed to exist are used here: Hide/Settings/Logout).
        <TopBar.Item
          key="recently-viewed"
          menu={false}
          icon={<Hide className="text-fg-primary" />}
          label={t('topbar.recentlyViewed')}
          onClick={() => {}}
        />,
        <TopBar.Item
          key="quick-search"
          menu={false}
          icon={<Settings className="text-fg-primary" />}
          label={t('topbar.quickSearch')}
          onClick={() => {}}
        />,
        <TopBar.Item
          key="my-profile"
          menu
          menuProps={{
            icon: <Settings />,
            label: t('topbar.myProfile'),
            items: [
              { icon: <Settings />, label: t('topbar.settings') },
              { icon: <Logout />, label: t('topbar.logout') },
            ],
          }}
        />,
      ]}
    >
      <TabMenu
        activeIndex={topNavigation.activeIndex}
        items={topNavigation.items.map((tab) => ({ label: t(tab.labelKey) }))}
        // The prop is typed as Dispatch<SetStateAction<number>>, so it must
        // also accept an updater function; resolve it against the current index.
        onChangeActiveIndex={(value: SetStateAction<number>) => {
          const index = typeof value === 'function' ? value(topNavigation.activeIndex) : value;
          const item = topNavigation.items[index];
          if (item) navigate(item.path);
        }}
      />
    </TopBar>
  );
};
