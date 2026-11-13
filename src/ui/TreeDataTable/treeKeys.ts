/**
 * Collect branches at every received depth. Lazy owners must supply getHasChildren:
 * an empty children array can mean the first page has not been requested yet.
 */
export function getExpandableTreeKeys<T>(
  nodes: readonly T[],
  getKey: (row: T) => string,
  getChildren: (row: T) => readonly T[],
  getHasChildren?: (row: T) => boolean,
): string[] {
  return nodes.flatMap((node) => {
    const children = getChildren(node);
    const hasChildren = getHasChildren?.(node) ?? children.length > 0;
    if (!hasChildren) return [];
    return [getKey(node), ...getExpandableTreeKeys(children, getKey, getChildren, getHasChildren)];
  });
}
