import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';

/**
 * Simple placeholder subpage for a top-bar section. Routes are generated
 * from the navigation manifest, so every tab gets one of these until it grows
 * a real page.
 */
export function SectionPage({
  titleKey,
  headingLevel = 1,
}: {
  titleKey: MessageKey;
  headingLevel?: 1 | 2;
}) {
  const { t } = useTranslation();
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <section>
      <Heading className="mb-2 text-2xl font-semibold text-accent">{t(titleKey)}</Heading>
      <p className="text-muted">{t('section.placeholder')}</p>
    </section>
  );
}
