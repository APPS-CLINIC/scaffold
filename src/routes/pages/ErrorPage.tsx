import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';

/**
 * Shared content for HTTP error pages (403, 404, ...). Centering and the
 * full-viewport canvas come from `ErrorLayout`.
 */
export function ErrorPage({ code, messageKey }: { code: number; messageKey: MessageKey }) {
  const { t } = useTranslation();
  return (
    <section className="grid place-content-center rounded-lg bg-surface px-16 py-12 text-center shadow-sm">
      <h1 className="text-6xl font-bold text-accent">{code}</h1>
      <p className="mt-2 text-muted">{t(messageKey)}</p>
      <Link to="/" className="mt-4 text-accent underline">
        {t('error.goHome')}
      </Link>
    </section>
  );
}
