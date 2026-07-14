import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded px-3 py-2 text-sm',
    isActive ? 'bg-accent font-medium text-white' : 'hover:bg-surface',
  ].join(' ');

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
      <header className="flex items-baseline gap-3 border-b border-border bg-surface px-4 py-3">
        <strong>{t('app.title')}</strong>
        <span className="text-sm text-muted">React · Vite · Redux Toolkit · URL-driven state</span>
      </header>
      <div className="flex min-h-0">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-border bg-surface-muted p-3">
          <h2 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('nav.title')}
          </h2>
          <nav aria-label={t('nav.title')}>
            <ul className="space-y-1">
              <li>
                <NavLink to="/" end className={navLinkClass}>
                  {t('nav.home')}
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border bg-surface px-4 py-2 text-sm text-muted">
        {t('footer.note', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
