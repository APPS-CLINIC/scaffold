import type {
  FacilityAmounts,
  FacilityDisplayCurrency,
  FacilityLevel,
  FacilityNode,
  FacilityRow,
} from './facilities.types';

/** Presentation-only projection; the transport proposal keeps its separate node/data shape. */
export interface FacilityTableRow extends Omit<FacilityRow, 'amounts'>, FacilityAmounts {
  source: FacilityRow;
  key: string;
  businessLevel: FacilityLevel;
  isContext: boolean;
  children: readonly FacilityTableRow[];
  hasChildren: boolean;
  childrenState: FacilityNode['childrenState'];
  nextCursor: string | null;
}

export function toFacilityTableRows(
  nodes: readonly FacilityNode[],
  currency: FacilityDisplayCurrency,
  contextKeys: ReadonlySet<string>,
): FacilityTableRow[] {
  return nodes.map((node) => {
    const { amounts, ...data } = node.data;
    return {
      ...data,
      ...amounts[currency],
      source: node.data,
      key: node.key,
      businessLevel: node.businessLevel,
      hasChildren: node.hasChildren,
      childrenState: node.childrenState,
      nextCursor: node.nextCursor,
      isContext: contextKeys.has(node.key),
      children: toFacilityTableRows(node.children, currency, contextKeys),
    };
  });
}

export const facilityTableRowKey = (row: FacilityTableRow) => row.key;
export const facilityTableRowChildren = (row: FacilityTableRow) => row.children;
export const facilityTableRowHasChildren = (row: FacilityTableRow) => row.hasChildren;
export const facilityTableRowChildrenLoading = (row: FacilityTableRow) =>
  row.childrenState === 'loading';
