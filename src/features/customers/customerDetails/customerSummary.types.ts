import type { CustomerStatus } from '../customers.types';

/**
 * Raw payload from `GET /api/v1/customers/{id}/summary`. Every value can be
 * null; the presentation layer reserves every configured field and renders
 * its empty-value fallback without collapsing the layout.
 *
 * `cddRiskLevel`/`cddExpirationDate` are modeled here because the backend
 * always returns them alongside the master-data fields; the CDD/CRS/FATCA
 * tab is what renders them, not the summary panel.
 */
export interface CustomerSummaryResponse {
  fullName: string | null;
  grid: string | null;
  corporateGroupName: string | null;
  corporateGroupGrid: string | null;
  internalGroupName: string | null;
  pamLam: string | null;
  homeCountry: string | null;
  segmentColor: string | null;
  rating: string | null;
  status: string | null;
  kkf: string | null;
  pamName: string | null;
  lendingRatingDate: string | null;
  cddRiskLevel: string | null;
  cddExpirationDate: string | null;
}

/** App-facing summary with the backend status label normalized for `Status`. */
export interface CustomerSummary extends Omit<CustomerSummaryResponse, 'status'> {
  status: CustomerStatus | null;
}
