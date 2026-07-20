import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';

/**
 * Simple placeholder subpage for a top-bar section. Routes are generated
 * from `navTabs`, so every tab gets one of these until it grows a real page.
 */
export function SectionPage({ titleKey }: { titleKey: MessageKey }) {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="mb-2 text-2xl font-semibold text-accent">{t(titleKey)}</h1>
      <p className="text-muted">{t('section.placeholder')}</p>
    </section>
  );
}
