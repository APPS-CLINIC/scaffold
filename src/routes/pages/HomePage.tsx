import { useT } from '@/i18n';

/**
 * Placeholder landing page. Replace it with your first real feature — the
 * scaffold already provides the store, API layer, auth, i18n, the UI seam,
 * routing and the URL-driven state pattern to build on.
 */
export function HomePage() {
  const t = useT();
  return (
    <section>
      <h1>{t('app.title')}</h1>
      <p>{t('home.intro')}</p>
    </section>
  );
}
