import type { FacilityAmounts, FacilityRow, FacilitySnapshot } from '@/features/facilities';

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

/** Complete forest: levels 1–6, siblings, a root at business level 3, and inactive slots. */
export const facilityPreviewSnapshot: FacilitySnapshot = {
  asOf: '2026-11-06',
  nodes: [
    {
      key: 'lending-1',
      businessLevel: 1,
      data: row('1001'),
      children: [
        {
          key: 'lending-2',
          businessLevel: 2,
          data: row('1002', { description: 'Example second-level facility' }),
          children: [
            {
              key: 'lending-3',
              businessLevel: 3,
              data: row('1003'),
              children: [
                {
                  key: 'lending-4',
                  businessLevel: 4,
                  data: row('1004'),
                  children: [
                    {
                      key: 'lending-5',
                      businessLevel: 5,
                      data: row('1005'),
                      children: [
                        {
                          key: 'lending-6',
                          businessLevel: 6,
                          data: row('1006', {
                            description: 'Target facility at level six',
                            type: 'TERM LOAN',
                          }),
                          children: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  key: 'lending-sibling',
                  businessLevel: 4,
                  data: row('1007', { type: 'OVERDRAFT' }),
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'intraday-3',
      businessLevel: 3,
      data: row('2001', {
        group: 'INTRADAY',
        type: 'INTRADAY LIMIT',
        description: 'Independent tree starting at business level three',
        contractCurrency: 'EUR',
        amounts: { original: eur, PLN: pln, EUR: eur },
      }),
      children: [
        {
          key: 'intraday-4',
          businessLevel: 4,
          data: row('2002', { group: 'INTRADAY', type: 'INTRADAY LIMIT' }),
          children: [],
        },
      ],
    },
    {
      key: 'tfs-1',
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
      children: [],
    },
    {
      key: 'investment-1',
      businessLevel: 1,
      data: row('4001', { group: 'INVESTMENT', type: 'INVESTMENT' }),
      children: [],
    },
    {
      key: 'card-1',
      businessLevel: 1,
      data: row('5001', { group: 'CARD', type: 'CARD LIMIT', commitment: 'U' }),
      children: [],
    },
    {
      key: 'other-1',
      businessLevel: 1,
      data: row('6001', {
        group: 'OTHER',
        type: 'MULTIPURPOSE',
        status: 'ARCHIVAL',
        expiryDate: null,
        looDate: null,
        description: 'Archived example without dates',
      }),
      children: [],
    },
  ],
  // Precomputed independent-group totals; the seven lending rows share one group limit.
  summaries: [
    { group: 'LENDING', amounts: { PLN: pln, EUR: eur } },
    { group: 'TFS', amounts: { PLN: pln, EUR: eur } },
    { group: 'INTRADAY', amounts: { PLN: pln, EUR: eur } },
    { group: 'INVESTMENT', amounts: { PLN: pln, EUR: eur } },
    { group: 'CARD', amounts: { PLN: pln, EUR: eur } },
    { group: 'OTHER', amounts: { PLN: pln, EUR: eur } },
  ],
};
