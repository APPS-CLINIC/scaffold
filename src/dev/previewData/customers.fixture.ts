import type { CustomerResponse, PageResponse } from '@/features/customers/customers.types';

export function createCustomerResponseFixture(
  id: number,
  fullName: string,
  overrides: Partial<CustomerResponse> = {},
): CustomerResponse {
  return {
    id,
    fullName,
    shortName: fullName,
    grid: String(id),
    corporateGroupId: null,
    corporateGroupName: null,
    corporateGroupGRID: null,
    internalGroupId: null,
    internalGroupName: null,
    kkf: null,
    krs: null,
    taxId: null,
    regon: null,
    rmAdvisor: null,
    lendingAdvisor: null,
    sfAdvisor: null,
    pcmAdvisor: null,
    fmAdvisor: null,
    tsAdvisor: null,
    ebdAdvisor: null,
    implementationAdvisor: null,
    customerServiceAdvisor: null,
    extensionReviewDate: null,
    lendingReviewDate: null,
    lendingRatingDate: null,
    lendingRatingReviewDate: null,
    tsPriceConditionEndDate: null,
    tsPriceConditionStatus: null,
    type: 'Corporate',
    status: 'ACTIVE',
    ...overrides,
  };
}

/** Static first page used only by the opt-in development preview and tests. */
export const customerFirstPageResponse: PageResponse<CustomerResponse> = {
  content: [
    createCustomerResponseFixture(23997, 'ARCELORMITTAL WARSAW SP. Z O.O.', {
      shortName: 'ARCELORMITTAL WARSAW',
      lendingAdvisor: 'Drewniak Dariusz',
    }),
    createCustomerResponseFixture(24099, 'COMARCH S.A.'),
    createCustomerResponseFixture(24554, 'ABB SP. Z O.O.'),
    createCustomerResponseFixture(24853, 'ENERGY RAIL SERVICES SP. Z O.O.'),
    createCustomerResponseFixture(26606, 'EMITEL S.A.'),
    createCustomerResponseFixture(27994, 'CEFARM SP. Z O.O.', { status: 'ARCHIVAL' }),
    createCustomerResponseFixture(30101, 'NORDIC FOODS POLAND SP. Z O.O.'),
    createCustomerResponseFixture(31102, 'POLISH LOGISTICS S.A.'),
    createCustomerResponseFixture(32103, 'CENTRAL INDUSTRIES SP. Z O.O.'),
    createCustomerResponseFixture(33104, 'GREEN ENERGY POLAND S.A.'),
  ],
  page: { size: 10, number: 0, totalElements: 15, totalPages: 2 },
};
