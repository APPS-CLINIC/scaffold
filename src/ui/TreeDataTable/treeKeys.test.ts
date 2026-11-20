import { describe, expect, it } from 'vitest';
import { getExpandableTreeKeys } from './treeKeys';

interface Branch {
  key: string;
  hasChildren: boolean;
  children: Branch[];
}

const getKey = (node: Branch) => node.key;
const getChildren = (node: Branch) => node.children;
const getHasChildren = (node: Branch) => node.hasChildren;

describe('getExpandableTreeKeys', () => {
  it('includes an unloaded root so expand all can request its first child page', () => {
    const roots: Branch[] = [{ key: 'root', hasChildren: true, children: [] }];
    expect(getExpandableTreeKeys(roots, getKey, getChildren, getHasChildren)).toEqual(['root']);
    expect(getExpandableTreeKeys(roots, getKey, getChildren)).toEqual([]);
  });

  it('collects loaded and unloaded branches at every received depth, excluding leaves', () => {
    const roots: Branch[] = [
      {
        key: 'root',
        hasChildren: true,
        children: [
          { key: 'unloaded', hasChildren: true, children: [] },
          { key: 'leaf', hasChildren: false, children: [] },
        ],
      },
      { key: 'independent', hasChildren: true, children: [] },
    ];
    expect(getExpandableTreeKeys(roots, getKey, getChildren, getHasChildren)).toEqual([
      'root',
      'unloaded',
      'independent',
    ]);
  });
});
