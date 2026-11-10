import { describe, expect, it } from 'vitest';
import { facilityPreviewSnapshot } from '@/dev/facilities/facilities.fixture';
import { filterFacilities, facilityFiltersSchema } from './facilities.filters';
import type { FacilityNode } from './facilities.types';

function flatten(nodes: readonly FacilityNode[]): FacilityNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

const source = facilityPreviewSnapshot.nodes;

describe('Facilities tree filtering', () => {
  it('preserves child metadata when the next level has not been received', () => {
    const root = source[0];
    if (!root) throw new Error('Expected a root fixture');
    const result = filterFacilities([{ ...root, children: [], childrenState: 'unloaded' }], {
      q: '',
      filters: {},
    });
    expect(result.nodes[0]).toMatchObject({ hasChildren: true, childrenCount: 1, children: [] });
  });
  it('does not turn a partial sibling page into a complete child count', () => {
    const parent = flatten(source).find((node) => node.key === 'lending-3');
    if (!parent) throw new Error('Expected the paginated fixture');
    const result = filterFacilities(
      [{ ...parent, children: parent.children.slice(0, 1), nextCursor: '1' }],
      { q: '', filters: {} },
    );
    expect(result.nodes[0]).toMatchObject({ hasChildren: true, childrenCount: 2, nextCursor: '1' });
  });
  it('keeps the same Lending hierarchy in All and Lending without automatic expansion', () => {
    const all = filterFacilities(source, { q: '', filters: {} });
    const lending = filterFacilities(source, { q: '', filters: { group: ['LENDING'] } });
    const allBranch = all.nodes.find((node) => node.key === 'lending-1');
    expect(lending.nodes.find((node) => node.key === 'lending-1')).toEqual(allBranch);
    expect(allBranch).toMatchObject({ hasChildren: true, childrenCount: 1 });
    expect(all.autoExpandedKeys).toEqual([]);
    expect(lending.autoExpandedKeys).toEqual([]);
  });
  it('includes TFS in Lending and does not duplicate nodes when both groups are selected', () => {
    const lending = filterFacilities(source, { q: '', filters: { group: ['LENDING'] } });
    const both = filterFacilities(source, { q: '', filters: { group: ['LENDING', 'TFS'] } });
    expect(lending.nodes.some((node) => node.key === 'tfs-1')).toBe(true);
    expect(flatten(both.nodes).map((node) => node.key)).toEqual(
      flatten(lending.nodes).map((node) => node.key),
    );
    expect(both.matchingCount).toBe(8);
  });
  it('keeps a complete six-level tree and a root at business level three without manufacturing ancestors', () => {
    const result = filterFacilities(source, { q: '', filters: {} });
    expect(result.nodes.map((node) => node.key)).toEqual(source.map((node) => node.key));
    expect(flatten(result.nodes).map((node) => node.businessLevel)).toContain(6);
    expect(result.nodes.find((node) => node.key === 'intraday-3')?.businessLevel).toBe(3);
    expect(result.contextKeys).toEqual([]);
    expect(result.autoExpandedKeys).toEqual([]);
    expect(result.matchingCount).toBe(flatten(source).length);
  });

  it('finds a collapsed leaf and keeps only its ancestor path as context', () => {
    const before = JSON.stringify(source);
    const result = filterFacilities(source, { q: 'TARGET', filters: {} });
    expect(flatten(result.nodes).map((node) => node.key)).toEqual([
      'lending-1',
      'lending-2',
      'lending-3',
      'lending-4',
      'lending-5',
      'lending-6',
    ]);
    expect(result.matchingCount).toBe(1);
    expect(new Set(result.contextKeys)).toEqual(
      new Set(['lending-1', 'lending-2', 'lending-3', 'lending-4', 'lending-5']),
    );
    expect(new Set(result.autoExpandedKeys)).toEqual(new Set(result.contextKeys));
    expect(JSON.stringify(source)).toBe(before);
  });

  it('combines group, type, contract currency and commitment without losing ancestor context', () => {
    const result = filterFacilities(source, {
      q: '',
      filters: {
        group: ['LENDING'],
        facilityType: ['TERM LOAN'],
        contractCurrency: ['PLN'],
        commitment: ['C'],
      },
    });
    expect(result.matchingCount).toBe(1);
    expect(flatten(result.nodes).at(-1)?.data.number).toBe('F-1006');
    expect(
      filterFacilities(source, { q: '', filters: { group: ['CARD'], commitment: ['C'] } }).nodes,
    ).toEqual([]);
  });

  it('applies the level cap to business levels, including roots that start at level three', () => {
    const result = filterFacilities(source, { q: '', filters: { maxLevel: ['2'] } });
    expect(flatten(result.nodes).every((node) => node.businessLevel <= 2)).toBe(true);
    expect(result.nodes.some((node) => node.key === 'intraday-3')).toBe(false);
    expect(flatten(source).some((node) => node.businessLevel === 6)).toBe(true);
  });

  it('uses inclusive date bounds and excludes missing dates only when a bound applies', () => {
    const all = filterFacilities(source, { q: '', filters: {} });
    const ranged = filterFacilities(source, {
      q: '',
      filters: {
        'expiryDate.from': ['2027-09-29'],
        'expiryDate.to': ['2027-09-29'],
      },
    });
    expect(all.nodes.some((node) => node.key === 'other-1')).toBe(true);
    expect(ranged.nodes.some((node) => node.key === 'other-1')).toBe(false);
    expect(ranged.matchingCount).toBe(all.matchingCount - 1);
    expect(
      filterFacilities(source, { q: '', filters: { 'looDate.to': ['2020-01-01'] } }).nodes,
    ).toEqual([]);
  });

  it('treats the display currency as presentation rather than a row filter', () => {
    const result = filterFacilities(source, { q: '', filters: { displayCurrency: ['EUR'] } });
    expect(result.matchingCount).toBe(flatten(source).length);
    expect(result.autoExpandedKeys).toEqual([]);
    expect(result.filters.displayCurrency).toBe('EUR');
  });

  it('parses malformed URL values without throwing, drops reversed ranges and keeps single controls single', () => {
    const parsed = facilityFiltersSchema.parse({
      group: ['UNKNOWN', 'TFS'],
      maxLevel: ['NaN'],
      displayCurrency: ['JPY'],
      commitment: ['U', 'C'],
      contractCurrency: ['EUR', 'PLN'],
      facilityType: null,
      'looDate.to': ['not-a-date'],
      'expiryDate.from': ['2028-01-01'],
      'expiryDate.to': ['2020-01-01'],
    });
    expect(parsed).toMatchObject({
      group: ['TFS'],
      maxLevel: 6,
      displayCurrency: 'original',
      commitment: ['U'],
      contractCurrency: ['EUR'],
      facilityType: [],
      'looDate.to': [],
      'expiryDate.from': [],
      'expiryDate.to': [],
    });
  });
});
