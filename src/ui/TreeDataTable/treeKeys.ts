/** Collect branches at every depth; leaves never count towards "expand all". */
export function getExpandableTreeKeys<T>(
  nodes: readonly T[],
  getKey: (row: T) => string,
  getChildren: (row: T) => readonly T[],
  getHasChildren?: (row: T) => boolean,
): string[] {
  return nodes.flatMap((node) => {
    const children = getChildren(node);
    return (getHasChildren?.(node) ?? children.length > 0)
      ? [getKey(node), ...getExpandableTreeKeys(children, getKey, getChildren, getHasChildren)]
      : [];
  });
}
