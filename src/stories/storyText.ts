import i18n from '@/i18n';

/** Play assertions use the same messages as the isolated story's selected locale. */
export const storyText = (globals: Record<string, unknown>) =>
  i18n.getFixedT(globals.locale === 'pl' ? 'pl' : 'en');
