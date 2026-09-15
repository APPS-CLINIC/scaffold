import { describe, expect, it } from 'vitest';
import { pl } from '@/i18n/messages/pl';
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
  status: 'ACTIVE',
};

describe('customer response adapter', () => {
  it('normalizes backend status values without renaming response fields', () => {
    expect(mapCustomerResponse({ ...response, tsPriceConditionStatus: 2 })).toMatchObject({
      fullName: response.fullName,
      taxId: response.taxId,
      status: 'ACTIVE',
      tsPriceConditionStatus: 2,
    });
  });

  it('maps the archival status case-insensitively', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: ' Archival ',
      }),
    ).toMatchObject({ status: 'ARCHIVAL' });
  });

  it('rejects labels outside the English-only contract', () => {
    // Polish labels are no longer part of the backend contract.
    expect(
      mapCustomerResponse({
        ...response,
        status: pl['common.status.active'],
      }),
    ).toMatchObject({ status: null });

    expect(
      mapCustomerResponse({
        ...response,
        status: 'unexpected',
      }),
    ).toMatchObject({ status: null });
  });

  it('rejects labels that collide with Object.prototype members', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: 'constructor',
      }),
    ).toMatchObject({ status: null });
  });

  it('degrades non-string payload values to null instead of crashing', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: 42 as unknown as string,
      }),
    ).toMatchObject({ status: null });
  });
});
