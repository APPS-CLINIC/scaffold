import { vi } from 'vitest';
import type {
  CustomerAdvisorsResponse,
  CustomerDetailsResponse,
} from '@/features/customers/customerDetails/customerDetails.types';
import type { CustomerSummaryResponse } from '@/features/customers/customerDetails/customerSummary.types';

export const customerDetailsResponseFixture: CustomerDetailsResponse = {
  basicData: {
    catalogOpenDate: '2014-06-12',
    reviewExtensionDate: null,
    taxId: '5250000000',
    regon: '012345678',
    krs: '0000123456',
    residenceCountry: 'Poland',
    registrationCountry: 'Poland',
    customerType: 'Corporate',
    sector: 'Industry',
    subSector: 'Steel production',
    nbpEntityType: 'Non-financial corporation',
    nbpEntityTypeDescription: 'Private corporation',
    naicsCode: '331110',
    naicsName: 'Iron and steel mills and ferroalloy manufacturing',
  },
  addresses: {
    mainAddress: {
      street: 'Main Street 123',
      city: 'Warsaw',
      postalCode: '00-001',
    },
    mailingAddress: {
      street: 'Main Street 123',
      city: 'Warsaw',
      postalCode: '00-001',
    },
  },
  consents: {
    electronicBskMarketingConsent: true,
    bskTransferConsent: true,
    nvTransferConsent: false,
    traditionalBskMarketingConsent: true,
    udbTransferConsent: false,
    fromIngLeaseConsent: false,
    toIngLeaseConsent: true,
    fromCommercialFinanceConsent: false,
    toCommercialFinanceConsent: true,
    outsideBankConsent: true,
  },
  crs: {
    crsStatus: 'Completed',
    crsProcessType: 'Review',
    crsReviewDate: '2026-12-12',
    crsClassificationDate: '2025-08-30',
  },
  fatca: {
    fatcaStatus: 'Completed',
    fatcaClassificationDate: '2025-08-30',
    fatcaReviewDate: '2026-08-31',
    fatcaReviewType: 'Periodic',
  },
  mifid: {
    mifidClassification: 'Professional',
    mifidTestDate: '2026-02-22',
    mifidPolicyDate: '2025-11-05',
    mifidInterestConflictDate: '2026-02-22',
    testM01: true,
    testM02: true,
    testM03: true,
    testM04: true,
    testM05: true,
    testM06: true,
    testM07: false,
    testM08: false,
    testM09: true,
    testM10: null,
  },
  lei: {
    leiCode: '5493001KJTIIGC8Y1R12',
    leiCodeValidityDate: '2026-12-31',
  },
  emir: {
    emirClassification: 'NFC+',
    emirReporting: true,
  },
  cpac: {
    cpacClassification: 'Professional',
    cpacClassificationDate: '2026-02-22',
  },
};

export const customerAdvisorsResponseFixture: CustomerAdvisorsResponse = {
  rmAdvisor: 'Alex Morgan',
  lendingAdvisor: 'Taylor Reed',
  sfAdvisor: 'Jordan Blake',
  pcmAdvisor: 'Casey Quinn',
  fmAdvisor: 'Morgan Lee',
  tsAdvisor: 'Riley Parker',
  ebdAdvisor: 'Jamie Brooks',
  implementationAdvisor: 'Avery Collins',
  customerServiceAdvisor: 'Cameron Hayes',
};

export const customerSummaryResponseFixture: CustomerSummaryResponse = {
  fullName: 'ACME Corporation',
  grid: 'PL12345678',
  corporateGroupName: null,
  corporateGroupGrid: 'PL87654321',
  internalGroupName: 'ACME Group',
  pamLam: 'PAM',
  homeCountry: 'Poland',
  segmentColor: 'Orange',
  rating: 'AAA',
  status: 'ACTIVE',
  kkf: null,
  pamName: 'John Doe',
  lendingRatingDate: '2026-08-31',
  cddRiskLevel: null,
  cddExpirationDate: null,
};

const NativeRequest = globalThis.Request;
const TEST_ORIGIN = 'https://app.test';

class AbsoluteTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const requestInit = init ? { ...init, signal: undefined } : undefined;
    super(typeof input === 'string' ? new URL(input, TEST_ORIGIN) : input, requestInit);
  }
}

/**
 * Stubs `Request`/`fetch` so `useGetCustomerSummaryQuery` resolves through the real
 * RTK Query transport (matching how the production endpoint is reached) instead of a
 * pre-seeded cache entry. Only `/summary` paths resolve; anything else 404s, so this
 * stays safe to combine with `*.util.upsertQueryEntries` seeding for the other endpoints.
 * Call `vi.unstubAllGlobals()` in `afterEach` to restore the originals.
 */
export function stubCustomerSummaryFetch(overrides?: Partial<CustomerSummaryResponse>): void {
  vi.stubGlobal('Request', AbsoluteTestRequest);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const request = input instanceof NativeRequest ? input : new NativeRequest(input);
      if (!new URL(request.url).pathname.endsWith('/summary')) {
        return new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ...customerSummaryResponseFixture, ...overrides }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
}
