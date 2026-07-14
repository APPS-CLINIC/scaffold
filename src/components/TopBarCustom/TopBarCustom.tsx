import { TabMenu, TopBar } from 'iwa-react-components';
import { Hide, Logout, Settings } from 'ing-react-icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectActiveTabIndex } from '@/features/urlState/urlState.selectors';
import { navTabs } from '@/routes/navTabs';
import { Logo } from '@/components/Logo';

/**
 * Top bar with the primary tab navigation (IWA TopBar + TabMenu).
 *
 * The active tab is not local state: clicking a tab only navigates, the URL
 * is the source of truth. `UrlStateSync` mirrors the pathname into
 * `urlState.activeTab`, and `selectActiveTabIndex` feeds it back here — so
 * deep links, back/forward and programmatic navigation all highlight the
 * right tab.
 */
export const TopBarCustom = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeIndex = useAppSelector(selectActiveTabIndex);

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
          icon={<Hide className="text-fg-primary" />}
          label={t('topbar.recentlyViewed')}
          onClick={() => {}}
        />,
        <TopBar.Item
          key="quick-search"
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
        activeIndex={activeIndex}
        items={navTabs.map((tab) => ({ label: t(tab.labelKey) }))}
        onChangeActiveIndex={(index: number) => {
          const tab = navTabs[index];
          if (tab) navigate(tab.path);
        }}
      />
    </TopBar>
  );
};
