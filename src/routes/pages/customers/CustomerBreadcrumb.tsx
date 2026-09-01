import type { MouseEvent as ReactMouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveNavigation } from '@/routes/navigation';
import { BreadCrumb, type BreadCrumbItem } from '@/ui';

function formatUnknownPathSegment(segment: string): string {
  let decodedSegment = segment;
  try {
    decodedSegment = decodeURIComponent(segment);
  } catch {
    // A malformed escape remains observable instead of breaking navigation.
  }

  const label = decodedSegment.replace(/[-_]+/g, ' ').trim();
  return label ? `${label.charAt(0).toLocaleUpperCase()}${label.slice(1)}` : segment;
}

/**
 * Intercepts only ordinary same-origin clicks. Items retain real `href`s for
 * keyboard access, copy-link and non-JavaScript fallback, while normal clicks
 * stay inside React Router without a document reload.
 */
function useBreadcrumbLinkCapture() {
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

/**
 * All customers -> customer -> active tab -> configured or future descendants.
 * IWA renders the breadcrumb; this component only derives its hierarchy from
 * the URL and adapts its links to React Router.
 */
export function CustomerBreadcrumb({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string | null;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const onClickCapture = useBreadcrumbLinkCapture();
  const resolved = resolveNavigation(pathname);
  const items: BreadCrumbItem[] = resolved.breadcrumb.items.map((item) => {
    if (item.kind === 'message') {
      return { label: t(item.labelKey), url: item.path };
    }

    if (item.kind === 'parameter') {
      return {
        label: customerName ?? (item.value || customerId),
        url: item.path,
      };
    }

    return { label: formatUnknownPathSegment(item.segment), url: item.path };
  });

  return (
    <div onClickCapture={onClickCapture}>
      <BreadCrumb
        items={items}
        className="min-h-5 min-w-0 flex-nowrap overflow-x-auto whitespace-nowrap [&>span]:shrink-0"
      />
    </div>
  );
}
