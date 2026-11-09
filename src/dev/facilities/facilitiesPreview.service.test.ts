import { describe, expect, it } from 'vitest';
import { getFacilityPreviewChildren, getFacilityPreviewRoots } from './facilitiesPreview.service';

const query = { q: '', filters: {} };
describe('Facilities proposed transport responses', () => {
  it('sends roots only, with direct-child metadata and no descendants or client state', () => {
    const response = getFacilityPreviewRoots(query);
    expect(response.parentKey).toBeNull();
    expect(response.nodes).toHaveLength(6);
    expect(response.nodes.every((node) => node.parentKey === null)).toBe(true);
    expect(response.nodes[0]).toMatchObject({
      key: 'lending-1',
      hasChildren: true,
      childrenCount: 1,
    });
    expect(response.nodes.find((node) => node.key === 'tfs-1')).toMatchObject({
      hasChildren: false,
      childrenCount: 0,
    });
    expect(
      response.nodes.every((node) => !('children' in node) && !('childrenState' in node)),
    ).toBe(true);
    expect(response.view.matchingCount).toBe(13);
  });
  it('pages direct children independently, preserving branch and leaf identity', () => {
    const first = getFacilityPreviewChildren({ query, parentKey: 'lending-3' });
    expect(first).toMatchObject({ parentKey: 'lending-3', total: 2, nextCursor: '1' });
    expect(first.nodes).toHaveLength(1);
    expect(first.nodes[0]).toMatchObject({
      key: 'lending-4',
      parentKey: 'lending-3',
      hasChildren: true,
    });
    const second = getFacilityPreviewChildren({ query, parentKey: 'lending-3', cursor: '1' });
    expect(second.nodes[0]).toMatchObject({
      key: 'lending-sibling',
      hasChildren: false,
      childrenCount: 0,
    });
    expect(second.nextCursor).toBeNull();
    expect(() =>
      getFacilityPreviewChildren({ query, parentKey: 'lending-3', cursor: '-1' }),
    ).toThrow();
  });
  it('evaluates a deep search on the complete service-side catalogue while sending only its root', () => {
    const response = getFacilityPreviewRoots({ q: 'Target', filters: {} });
    expect(response.nodes).toHaveLength(1);
    expect(response.nodes[0]?.key).toBe('lending-1');
    expect(response.view.matchingCount).toBe(1);
    expect(response.view.contextKeys).toHaveLength(5);
    expect(response.view.autoExpandedKeys).toHaveLength(5);
  });
});
