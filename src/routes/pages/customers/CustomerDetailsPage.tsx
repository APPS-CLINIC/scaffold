import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Route-level entry point for a single customer. Deliberately empty for now:
 * the customer list links here in a new tab; content arrives in a later
 * iteration.
 */
export function CustomerDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <section aria-label={t('customers.details.title')} className="w-full min-w-0 max-w-full">
      <header>
        <h1 className="m-0 text-4xl font-bold leading-[48px] text-[var(--navigation-accent)]">
          {t('customers.details.title')}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{id}</p>
      </header>
    </section>
  );
}
