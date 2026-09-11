import { describe, expect, it } from 'vitest';
import { mapCustomerSummaryResponse } from './customerSummary.adapter';
import type { CustomerSummaryResponse } from './customerSummary.types';

const response: CustomerSummaryResponse = {
  fullName: 'ACME Corporation Ltd.',
  grid: 'PL12345678',
  corporateGroupName: 'ACME Group',
  corporateGroupGrid: 'PL87654321',
  internalGroupName: 'ACME Internal',
  pamLam: 'PAM123',
  homeCountry: 'PL',
  segmentColor: 'Green',
  rating: 'AAA',
  status: 'ACTIVE',
  kkf: '12345',
  pamName: 'John Doe',
  lendingRatingDate: '2023-12-31',
  cddRiskLevel: 'Low',
  cddExpirationDate: '2024-12-31',
};

describe('customer summary adapter', () => {
  it('normalizes the backend status and keeps every other field as-is', () => {
    expect(mapCustomerSummaryResponse(response)).toMatchObject({
      fullName: response.fullName,
      grid: response.grid,
      corporateGroupGrid: response.corporateGroupGrid,
      status: 'ACTIVE',
    });
  });

  it('maps the archival status case-insensitively, like the customer list adapter', () => {
    expect(mapCustomerSummaryResponse({ ...response, status: ' Archival ' })).toMatchObject({
      status: 'ARCHIVAL',
    });
  });

  it('degrades an unrecognized status to null instead of crashing', () => {
    expect(mapCustomerSummaryResponse({ ...response, status: 'unexpected' })).toMatchObject({
      status: null,
    });
  });
});
