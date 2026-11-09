import type {
  FacilityAmounts,
  FacilityRow,
  FacilitySnapshot,
  FacilityNodeDto,
  FacilityNode,
} from '@/features/facilities';

// Synthetic values supplied in both currencies. The view never invents an FX rate.
const pln: FacilityAmounts = {
  currency: 'PLN',
  grantedMinor: 40_000_000,
  utilizedMinor: 8_000_000,
  availableMinor: 32_000_000,
  utilization: 0.2,
};
const eur: FacilityAmounts = {
  currency: 'EUR',
  grantedMinor: 10_000_000,
  utilizedMinor: 2_000_000,
  availableMinor: 8_000_000,
  utilization: 0.2,
};

function row(id: string, overrides: Partial<FacilityRow> = {}): FacilityRow {
  return {
    id,
    number: 'F-' + id,
    status: 'ACTIVE',
    group: 'LENDING',
    type: 'AGGREGATED',
    description: 'Example credit facility',
    commitment: 'C',
    contractCurrency: 'PLN',
    expiryDate: '2027-09-29',
    looDate: '2026-09-29',
    amounts: { original: pln, PLN: pln, EUR: eur },
    indicators: {
      creditAccounts: ['Example account 001', 'Example account 002'],
      currencies: ['PLN', 'EUR'],
      borrowers: ['Example company'],
      collaterals: ['Example collateral'],
      structure: ['Example facility structure'],
      ownership: [],
      ratings: ['Example rating'],
    },
    ...overrides,
  };
}

/** Flat service-side catalogue. No nested transport fixture is kept alongside it. */
const records: Omit<FacilityNodeDto, 'hasChildren' | 'childrenCount'>[] = [
  { key: 'lending-1', parentKey: null, businessLevel: 1, data: row('1001') },
  {
    key: 'lending-2',
    parentKey: 'lending-1',
    businessLevel: 2,
    data: row('1002', { description: 'Example second-level facility' }),
  },
  { key: 'lending-3', parentKey: 'lending-2', businessLevel: 3, data: row('1003') },
  { key: 'lending-4', parentKey: 'lending-3', businessLevel: 4, data: row('1004') },
  { key: 'lending-5', parentKey: 'lending-4', businessLevel: 5, data: row('1005') },
  {
    key: 'lending-6',
    parentKey: 'lending-5',
    businessLevel: 6,
    data: row('1006', { description: 'Target facility at level six', type: 'TERM LOAN' }),
  },
  {
    key: 'lending-sibling',
    parentKey: 'lending-3',
    businessLevel: 4,
    data: row('1007', { type: 'OVERDRAFT' }),
  },
  {
    key: 'intraday-3',
    parentKey: null,
    businessLevel: 3,
    data: row('2001', {
      group: 'INTRADAY',
      type: 'INTRADAY LIMIT',
      description: 'Independent tree starting at business level three',
      contractCurrency: 'EUR',
      amounts: { original: eur, PLN: pln, EUR: eur },
    }),
  },
  {
    key: 'intraday-4',
    parentKey: 'intraday-3',
    businessLevel: 4,
    data: row('2002', { group: 'INTRADAY', type: 'INTRADAY LIMIT' }),
  },
  {
    key: 'tfs-1',
    parentKey: null,
    businessLevel: 1,
    data: row('3001', {
      group: 'TFS',
      type: 'TFS',
      indicators: {
        creditAccounts: [],
        currencies: [
          'PLN',
          'EUR',
          'USD',
          'GBP',
          'CHF',
          'CZK',
          'SEK',
          'NOK',
          'DKK',
          'JPY',
          'CAD',
          'AUD',
        ],
        borrowers: [],
        collaterals: [],
        structure: [],
        ownership: [],
        ratings: [],
      },
    }),
  },
  {
    key: 'investment-1',
    parentKey: null,
    businessLevel: 1,
    data: row('4001', { group: 'INVESTMENT', type: 'INVESTMENT' }),
  },
  {
    key: 'card-1',
    parentKey: null,
    businessLevel: 1,
    data: row('5001', { group: 'CARD', type: 'CARD LIMIT', commitment: 'U' }),
  },
  {
    key: 'other-1',
    parentKey: null,
    businessLevel: 1,
    data: row('6001', {
      group: 'OTHER',
      type: 'MULTIPURPOSE',
      status: 'ARCHIVAL',
      expiryDate: null,
      looDate: null,
      description: 'Archived example without dates',
    }),
  },
];
const childCounts = new Map<string | null, number>();
for (const node of records)
  childCounts.set(node.parentKey, (childCounts.get(node.parentKey) ?? 0) + 1);

/** Only this flat node format crosses the simulated service boundary. */
export const facilityPreviewCatalogue: readonly FacilityNodeDto[] = records.map((node) => {
  const childrenCount = childCounts.get(node.key) ?? 0;
  return { ...node, hasChildren: childrenCount > 0, childrenCount };
});
function completeNodes(parentKey: string | null): FacilityNode[] {
  return facilityPreviewCatalogue
    .filter((node) => node.parentKey === parentKey)
    .map((node) => ({
      ...node,
      childrenState: 'loaded',
      nextCursor: null,
      children: completeNodes(node.key),
    }));
}

/** Service-side model for evaluating queries. The root response never sends this forest. */
export const facilityPreviewSnapshot: FacilitySnapshot = {
  asOf: '2026-11-09',
  nodes: completeNodes(null),
  // Independent totals, never a sum of parents and descendants.
  summaries: [
    { group: 'LENDING', amounts: { PLN: pln, EUR: eur } },
    { group: 'TFS', amounts: { PLN: pln, EUR: eur } },
    { group: 'INTRADAY', amounts: { PLN: pln, EUR: eur } },
    { group: 'INVESTMENT', amounts: { PLN: pln, EUR: eur } },
    { group: 'CARD', amounts: { PLN: pln, EUR: eur } },
    { group: 'OTHER', amounts: { PLN: pln, EUR: eur } },
  ],
};
