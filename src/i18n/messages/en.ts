import type { MessageKey } from './pl';

/**
 * English messages. Typed as `Record<MessageKey, string>` so the compiler fails
 * the build if a key is missing or misspelled relative to the Polish catalog.
 */
export const en: Record<MessageKey, string> = {
  'app.title': 'Scaffold',
  'common.search': 'Search',
  'common.loading': 'Loading…',
  'common.empty': 'No data',
  'common.results': '{{count}} results',
  'home.intro': 'Clean scaffold — add your first feature.',
};
