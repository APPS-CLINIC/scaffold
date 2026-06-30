import type { MessageKey } from './pl';

/**
 * English messages. Typed as `Record<MessageKey, string>` so the compiler fails
 * the build if a key is missing or misspelled relative to the Polish catalog.
 */
export const en: Record<MessageKey, string> = {
  'app.title': 'BIX',
  'nav.portfolio': 'Portfolio',
  'nav.clients': 'Clients',
  'common.search': 'Search',
  'common.loading': 'Loading…',
  'common.empty': 'No data',
  'home.intro': 'Clean scaffold — add your first feature.',
  'entity.client': 'Client',
  'entity.capitalGroup': 'Capital group',
  'entity.ownGroup': 'Own group',
  'entity.count': '{count} entities',
};
