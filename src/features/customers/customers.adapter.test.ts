import { describe, expect, it } from 'vitest';
import { mapCustomerResponse } from './customers.adapter';
import type { CustomerResponse } from './customers.types';

const response: CustomerResponse = {
  id: 23997,
  fullName: 'ARCELORMITTAL WARSZAWA SP. Z O.O.',
  shortName: 'ARCELORMITTAL WARSZAWA SP. Z O.O.',
  grid: '46034616',
  corporateGroupId: 1739,
  corporateGroupName: 'Arcelormittal SA',
  corporateGroupGRID: '36142003',
  internalGroupId: 53,
  internalGroupName: 'ArcelorMittal',
  kkf: '2203666408',
  krs: '43770',
  taxId: '1180016775',
  regon: '10592085',
  rmAdvisor: 'Merta Katarzyna',
  lendingAdvisor: 'Drewniak Dariusz',
  sfAdvisor: null,
  pcmAdvisor: 'Drenda Dariusz',
  fmAdvisor: 'Weryk Bartosz',
  tsAdvisor: 'Drenda Dariusz',
  ebdAdvisor: 'Korniluk Piotr',
  implementationAdvisor: 'Barylska Ewelina',
  customerServiceAdvisor: 'Boguta Magdalena',
  extensionReviewDate: null,
  lendingReviewDate: '2026-02-10',
  lendingRatingDate: '2025-12-18',
  lendingRatingReviewDate: '2025-12-18',
  tsPriceConditionEndDate: null,
  tsPriceConditionStatus: null,
  type: 'Corporate',
  status: 'aktywny',
};

describe('customer response adapter', () => {
  it('normalizes backend status labels without renaming response fields', () => {
    expect(mapCustomerResponse(response)).toMatchObject({
      fullName: response.fullName,
      taxId: response.taxId,
      status: 'active',
      tsPriceConditionStatus: null,
    });
  });

  it('maps known inactive and pricing labels and rejects unknown labels safely', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: 'nieaktywny',
        tsPriceConditionStatus: 'Wygasł',
      }),
    ).toMatchObject({ status: 'inactive', tsPriceConditionStatus: 'expired' });

    expect(
      mapCustomerResponse({
        ...response,
        status: 'unexpected',
        tsPriceConditionStatus: 'unexpected',
      }),
    ).toMatchObject({ status: null, tsPriceConditionStatus: null });
  });

  it('rejects labels that collide with Object.prototype members', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: 'constructor',
        tsPriceConditionStatus: ' __proto__ ',
      }),
    ).toMatchObject({ status: null, tsPriceConditionStatus: null });
  });
});
