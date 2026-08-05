import { describe, expect, it } from 'vitest';
import { customerTableConfig } from './config';

describe('customerTableConfig', () => {
  it('keeps the reference column order explicit', () => {
    expect(customerTableConfig.columns.map(({ field }) => field)).toEqual([
      'fullName',
      'grid',
      'status',
      'corporateGroupName',
      'type',
      'lendingRatingReviewDate',
      'tsPriceConditionEndDate',
      'tsPriceConditionStatus',
      'lendingReviewDate',
    ]);
  });

  it('exposes only the approved fields in expanded rows', () => {
    expect(customerTableConfig.detailFields.map(({ field }) => field)).toEqual([
      'kkf',
      'krs',
      'taxId',
      'regon',
      'shortName',
      'rmAdvisor',
      'corporateGroupGRID',
      'internalGroupName',
      'lendingAdvisor',
      'sfAdvisor',
      'pcmAdvisor',
      'fmAdvisor',
      'tsAdvisor',
      'ebdAdvisor',
      'implementationAdvisor',
      'customerServiceAdvisor',
    ]);
  });
});
