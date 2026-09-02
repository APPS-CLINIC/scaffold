import type { MouseEvent as ReactMouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveNavigation } from '@/routes/navigation';
import { ScreenHeading, type ScreenHeadingItem } from '@/ui';

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
  const rootItem = resolveNavigation(pathname).breadcrumb.items.find(
    (item) => item.id.startsWith('section-item:') && item.kind === 'message',
  );
  const items: readonly ScreenHeadingItem[] = rootItem
    ? [{ label: t('customers.details.backToList'), navigateTo: rootItem.path }]
    : [];

  return (
    <div onClickCapture={onClickCapture}>
      <ScreenHeading pageName={t('customers.details.pageTitle')} items={items} />
    </div>
  );
}
