import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';

/**
 * Shared layout for HTTP error pages (403, 404, ...). Rendered outside
 * RootLayout (no top bar / menu / footer), hence the full-viewport centering.
 */
export function ErrorPage({ code, messageKey }: { code: number; messageKey: MessageKey }) {
  const { t } = useTranslation();
  return (
    <section className="grid min-h-dvh place-content-center text-center">
      <h1 className="text-6xl font-bold text-accent">{code}</h1>
      <p className="mt-2 text-muted">{t(messageKey)}</p>
      <Link to="/" className="mt-4 text-accent underline">
        {t('error.goHome')}
      </Link>
    </section>
  );
}
