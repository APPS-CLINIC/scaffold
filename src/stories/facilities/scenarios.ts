import { facilityPreviewSnapshot } from '@/dev/facilities/facilities.fixture';
import {
  getFacilityPreviewChildren,
  getFacilityPreviewRoots,
} from '@/dev/facilities/facilitiesPreview.service';
import type { FacilityPreviewSource } from '@/dev/facilities/facilitiesPreview.service';
import { createFacilitiesPreviewTransport } from '@/dev/facilities/facilitiesPreview.transport';
import type { FacilityNode, FacilityNodeDto } from '@/features/facilities';

export type FacilitiesScenario =
  'default' | 'slow' | 'empty' | 'root-error' | 'branch-error' | 'large';

/** Many siblings exercise bounded root and child pages, not an eagerly rendered giant tree. */
export function createLargeFacilitiesSource(
  childCount = 1000,
  rootCount = 80,
): FacilityPreviewSource {
  const example = facilityPreviewSnapshot.nodes[0];
  if (!example) throw new Error('The Facilities catalogue needs a sample root');
  const leaf = (key: string, parentKey: string | null, number: string): FacilityNode => ({
    ...example,
    key,
    parentKey,
    businessLevel: parentKey ? 2 : 1,
    data: { ...example.data, id: key, number, description: 'Synthetic paginated facility' },
    hasChildren: false,
    childrenCount: 0,
    children: [],
    childrenState: 'loaded',
    nextCursor: null,
  });
  const children = Array.from({ length: childCount }, (_, index) =>
    leaf(`wide-child-${index + 1}`, 'wide-root', `F-CHILD-${String(index + 1).padStart(4, '0')}`),
  );
  const root: FacilityNode = {
    ...leaf('wide-root', null, 'F-WIDE-001'),
    children,
    hasChildren: children.length > 0,
    childrenCount: children.length,
  };
  const roots = [
    root,
    ...Array.from({ length: Math.max(0, rootCount - 1) }, (_, index) =>
      leaf(`extra-root-${index + 1}`, null, `F-ROOT-${String(index + 2).padStart(3, '0')}`),
    ),
  ];
  const catalogue: FacilityNodeDto[] = [...roots, ...children].map(
    ({ key, parentKey, businessLevel, hasChildren, childrenCount, data }) => ({
      key,
      parentKey,
      businessLevel,
      hasChildren,
      childrenCount,
      data,
    }),
  );
  return {
    catalogue,
    snapshot: { ...facilityPreviewSnapshot, nodes: roots },
    rootPageSize: 25,
    childPageSize: 25,
  };
}

/** One failure budget and data source per story/store; no module-global mock state. */
export function createFacilitiesScenario(scenario: FacilitiesScenario = 'default') {
  const source = scenario === 'large' ? createLargeFacilitiesSource() : undefined;
  let rootFailed = false;
  let branchFailed = false;
  return createFacilitiesPreviewTransport({
    delayMs: scenario === 'slow' ? 2000 : 500,
    roots: (query, cursor) => {
      if (scenario === 'root-error' && !rootFailed) {
        rootFailed = true;
        throw new Error('Example initial request failure');
      }
      return getFacilityPreviewRoots(
        scenario === 'empty' ? { ...query, q: '__no_example_matches__' } : query,
        cursor,
        source,
      );
    },
    children: (request) => {
      if (scenario === 'branch-error' && request.parentKey === 'lending-1' && !branchFailed) {
        branchFailed = true;
        throw new Error('Example branch failure');
      }
      return getFacilityPreviewChildren(request, source);
    },
  });
}
