/** A client, a capital group, or an own (lending) group. */
export type EntityType = 'client' | 'capitalGroup' | 'ownGroup';

export interface EntityRef {
  id: string;
  type: EntityType;
  name: string;
}

/**
 * A view target. The client view and the group views present the same data —
 * the only difference is how many members sit underneath. Modeling every
 * target as a collection (a client is a one-member collection) lets one set of
 * components and selectors serve both, and lets endpoints assume N from the
 * start.
 */
export interface EntityCollection {
  type: EntityType;
  members: EntityRef[];
}

export const isGroup = (type: EntityType): boolean =>
  type === 'capitalGroup' || type === 'ownGroup';

/** Wrap a single client/entity as a one-member collection. */
export function singleEntity(ref: EntityRef): EntityCollection {
  return { type: ref.type, members: [ref] };
}

export function entityCount(collection: EntityCollection): number {
  return collection.members.length;
}
