import { describe, expect, it } from 'vitest';
import { entityCount, isGroup, singleEntity, type EntityRef } from './entity.types';
import { entityColor, entityColorToken } from './entity.tokens';

const client: EntityRef = { id: 'c1', type: 'client', name: 'Acme' };

describe('entity model', () => {
  it('treats a client as a one-member collection', () => {
    const collection = singleEntity(client);
    expect(collection.type).toBe('client');
    expect(entityCount(collection)).toBe(1);
  });

  it('classifies groups vs single client', () => {
    expect(isGroup('client')).toBe(false);
    expect(isGroup('capitalGroup')).toBe(true);
    expect(isGroup('ownGroup')).toBe(true);
  });

  it('maps entity types to accent color tokens', () => {
    expect(entityColorToken.client).toBe('accentBlue');
    expect(entityColorToken.capitalGroup).toBe('accentBlue');
    expect(entityColorToken.ownGroup).toBe('accentPurple');
    expect(entityColor('ownGroup')).toBe('var(--color-accent-purple)');
  });
});
