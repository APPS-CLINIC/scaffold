import type { MouseEvent as ReactMouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNavigationItemPath, resolveNavigation } from '@/routes/navigation';
import { ScreenHeading, type ScreenHeadingItem } from '@/ui';

/**
 * The IWA ScreenHeading renders its items as plain anchors, which would trigger a full page
 * load. This capture handler routes same-origin, unmodified left clicks through React Router.
 */
function useHeadingLinkCapture() {
  const navigate = useNavigate();

  return (event: ReactMouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest('a[href]');
    if (!anchor || !event.currentTarget.contains(anchor)) return;
    if (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self') return;

    const destination = new URL(anchor.getAttribute('href') ?? '', window.location.href);
    if (destination.origin !== window.location.origin) return;

    event.preventDefault();
    navigate(`${destination.pathname}${destination.search}${destination.hash}`);
  };
}

/** IWA page heading with the manifest-configured return destination. */
export function CustomerDetailHeading() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const onClickCapture = useHeadingLinkCapture();
  const section = resolveNavigation(pathname).section;
  const rootItemId = section?.context?.breadcrumb?.rootItem;
  const rootItem = section?.sidebar.items.find((item) => item.id === rootItemId);
  const items: readonly ScreenHeadingItem[] =
    section && rootItem
      ? [
          {
            label: t('customers.details.backToList'),
            navigateTo: getNavigationItemPath(section, rootItem),
          },
        ]
      : [];

  return (
    <div onClickCapture={onClickCapture}>
      <ScreenHeading pageName={t('customers.details.pageTitle')} items={items} />
    </div>
  );
}
