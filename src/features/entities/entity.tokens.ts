import { colorTokens, type ColorToken } from '@/ui';
import type { EntityType } from './entity.types';

/**
 * Accent color per entity type — client and capital group render blue, own
 * group renders purple (matching the legacy BIX color coding). Components read
 * the color from here, never as a literal
 * (see docs/adr/0016-entity-parametrized-views.md).
 */
export const entityColorToken: Record<EntityType, ColorToken> = {
  client: 'accentBlue',
  capitalGroup: 'accentBlue',
  ownGroup: 'accentPurple',
};

export const entityColor = (type: EntityType): string => colorTokens[entityColorToken[type]];
