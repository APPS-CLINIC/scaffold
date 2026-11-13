export const FACILITY_GROUPS = [
  'LENDING',
  'TFS',
  'INTRADAY',
  'INVESTMENT',
  'CARD',
  'OTHER',
] as const;
export type FacilityGroup = (typeof FACILITY_GROUPS)[number];
export type FacilityCurrency = 'PLN' | 'EUR';
export type FacilityDisplayCurrency = 'original' | FacilityCurrency;
export const FACILITY_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type FacilityLevel = (typeof FACILITY_LEVELS)[number];
export type FacilityIndicator =
  | 'creditAccounts'
  | 'currencies'
  | 'borrowers'
  | 'collaterals'
  | 'structure'
  | 'ownership'
  | 'ratings';

/** Integer minor units avoid rounding while combining the supplied group summaries. */
export interface FacilityAmounts {
  currency: FacilityCurrency;
  grantedMinor: number;
  utilizedMinor: number;
  availableMinor: number;
  utilization: number | null;
}

/** A proposed FE presentation model, not a backend DTO or an agreed service contract. */
export interface FacilityRow {
  id: string;
  number: string;
  status: 'ACTIVE' | 'ARCHIVAL';
  group: FacilityGroup;
  type: string;
  description: string;
  commitment: 'C' | 'U';
  contractCurrency: FacilityCurrency;
  expiryDate: string | null;
  looDate: string | null;
  amounts: Readonly<Record<FacilityDisplayCurrency, FacilityAmounts>>;
  /** Empty entries mean an unavailable action; its information remains readable. */
  indicators: Readonly<Record<FacilityIndicator, readonly string[]>>;
}

/** Proposed transport node: one occurrence, with no embedded descendants or UI state. */
export interface FacilityNodeDto {
  key: string;
  parentKey: string | null;
  businessLevel: FacilityLevel;
  hasChildren: boolean;
  /** Number of direct children in the current query, not all descendants. */
  childrenCount: number;
  data: FacilityRow;
}

export interface FacilityNode extends FacilityNodeDto {
  children: readonly FacilityNode[];
  childrenState: 'unloaded' | 'loading' | 'loaded' | 'error';
  nextCursor: string | null;
}

/** A bounded page of siblings. Each parent has its own cursor. */
export interface FacilityChildrenResponse {
  parentKey: string | null;
  nodes: readonly FacilityNodeDto[];
  total: number;
  nextCursor: string | null;
}

export interface FacilityQueryMetadata {
  matchingCount: number;
  contextKeys: readonly string[];
  autoExpandedKeys: readonly string[];
  groupCounts: Readonly<Record<FacilityGroup, number>>;
  facilityTypes: readonly string[];
}

export interface FacilityRootsResponse extends FacilityChildrenResponse {
  parentKey: null;
  asOf: string;
  summaries: readonly FacilityGroupSummary[];
  view: FacilityQueryMetadata;
}

export interface FacilityGroupSummary {
  group: FacilityGroup;
  /** Precomputed values from the data provider; descendants must not be summed again. */
  amounts: Readonly<Record<FacilityCurrency, FacilityAmounts>>;
}

export interface FacilitySnapshot {
  asOf: string;
  nodes: readonly FacilityNode[];
  summaries: readonly FacilityGroupSummary[];
  /** Server-wide metadata prevents filtering/counting only the loaded portion. */
  view?: FacilityQueryMetadata;
}

export const facilityNodeKey = (node: FacilityNode) => node.key;
export const facilityNodeChildren = (node: FacilityNode) => node.children;
export const facilityNodeHasChildren = (node: FacilityNode) => node.hasChildren;
