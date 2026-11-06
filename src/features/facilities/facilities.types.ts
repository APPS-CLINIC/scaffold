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
export type FacilityLevel = 1 | 2 | 3 | 4 | 5 | 6;
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

export interface FacilityNode {
  key: string;
  businessLevel: FacilityLevel;
  data: FacilityRow;
  children: readonly FacilityNode[];
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
}

export const facilityNodeKey = (node: FacilityNode) => node.key;
export const facilityNodeChildren = (node: FacilityNode) => node.children;
