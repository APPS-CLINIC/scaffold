import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContextualSidebar } from '@/components/ContextualSidebar';
import { TopBarCustom } from '@/components/TopBarCustom';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';

/**
 * App shell: header on top, side menu + routed content in the middle, footer
 * at the bottom. The `h-dvh` grid (`auto 1fr auto`) pins header, menu and
 * footer to the viewport — only `<main>` scrolls (`min-h-0`/`overflow-y-auto`).
 *
 * `UrlStateSync` lives here (inside the router context) so the URL -> Redux
 * mirror is active on every route.
 */
export function RootLayout() {
  const { t } = useTranslation();
  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto]">
      <UrlStateSync />
      <header>
        <TopBarCustom />
      </header>
      <div className="flex min-h-0">
        <ContextualSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--content-surface)] p-6">
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border bg-surface px-4 py-2 text-sm text-muted">
        {t('footer.note', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
