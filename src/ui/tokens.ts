/**
 * Semantic color tokens. The values are CSS custom properties defined in
 * `src/styles/global.css`; reference these instead of hard-coding colors so the
 * palette lives in one place and entity accents stay consistent
 * (see docs/adr/0016-entity-parametrized-views.md).
 */
export const colorTokens = {
  accentBlue: 'var(--color-accent-blue)',
  accentPurple: 'var(--color-accent-purple)',
} as const;

export type ColorToken = keyof typeof colorTokens;
