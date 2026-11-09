import type { ListQuery } from '@/features/urlState/urlState.schema';
import { filterFacilities, includesFacilityGroup } from '@/features/facilities/facilities.filters';
import { FACILITY_GROUPS } from '@/features/facilities/facilities.types';
import type {
  FacilityChildrenResponse,
  FacilityNode,
  FacilityNodeDto,
  FacilityRootsResponse,
} from '@/features/facilities';
import { facilityPreviewCatalogue, facilityPreviewSnapshot } from './facilities.fixture';

export type FacilityPreviewQuery = Pick<ListQuery, 'q' | 'filters'>;
export interface FacilityChildrenRequest {
  query: FacilityPreviewQuery;
  parentKey: string | null;
  cursor?: string;
}

const ROOT_PAGE_SIZE = 50;
const CHILD_PAGE_SIZE = 1; // A small page deliberately demonstrates per-branch continuation.
function flatten(nodes: readonly FacilityNode[]): FacilityNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}
function toDto(node: FacilityNode): FacilityNodeDto {
  return {
    key: node.key,
    parentKey: node.parentKey,
    businessLevel: node.businessLevel,
    data: node.data,
    hasChildren: node.children.length > 0,
    childrenCount: node.children.length,
  };
}
function page(
  nodes: readonly FacilityNode[],
  parentKey: string | null,
  size: number,
  cursor = '0',
): FacilityChildrenResponse {
  const offset = Number(cursor);
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid example cursor');
  const end = Math.min(offset + size, nodes.length);
  return {
    parentKey,
    nodes: nodes.slice(offset, end).map(toDto),
    total: nodes.length,
    nextCursor: end < nodes.length ? String(end) : null,
  };
}

/** Simulated service operation: query the whole catalogue, send only a root page. */
export function getFacilityPreviewRoots(
  query: FacilityPreviewQuery,
  cursor?: string,
): FacilityRootsResponse {
  const result = filterFacilities(facilityPreviewSnapshot.nodes, query);
  return {
    ...page(result.nodes, null, ROOT_PAGE_SIZE, cursor),
    parentKey: null,
    asOf: facilityPreviewSnapshot.asOf,
    summaries: facilityPreviewSnapshot.summaries,
    view: {
      matchingCount: result.matchingCount,
      contextKeys: result.contextKeys,
      autoExpandedKeys: result.autoExpandedKeys,
      groupCounts: Object.fromEntries(
        FACILITY_GROUPS.map((group) => [
          group,
          facilityPreviewCatalogue.filter((node) => includesFacilityGroup(node.data.group, [group]))
            .length,
        ]),
      ) as Record<(typeof FACILITY_GROUPS)[number], number>,
      facilityTypes: [...new Set(facilityPreviewCatalogue.map((node) => node.data.type))].sort(),
    },
  };
}

/** Simulated service operation: direct children only, using a cursor scoped to the parent/query. */
export function getFacilityPreviewChildren({
  query,
  parentKey,
  cursor,
}: FacilityChildrenRequest): FacilityChildrenResponse {
  const result = filterFacilities(facilityPreviewSnapshot.nodes, query);
  if (parentKey === null) return page(result.nodes, null, ROOT_PAGE_SIZE, cursor);
  const parent = flatten(result.nodes).find((node) => node.key === parentKey);
  if (!parent) throw new Error('Unknown example parent');
  return page(parent.children, parentKey, CHILD_PAGE_SIZE, cursor);
}

/** Detail data is looked up separately from the partially loaded table. */
export function getFacilityPreviewDetail(id: string): FacilityNodeDto | undefined {
  return facilityPreviewCatalogue.find((node) => node.data.id === id);
}
