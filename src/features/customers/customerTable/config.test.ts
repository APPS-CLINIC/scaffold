import { describe, expect, it } from 'vitest';
import { customerTableConfig } from './config';

describe('customerTableConfig', () => {
  it('keeps the reference column order explicit', () => {
    expect(customerTableConfig.columns.map(({ field }) => field)).toEqual([
      'customerFullName',
      'grid',
      'customerStatus',
      'corporateGroupName',
      'customerSector',
      'dateReview',
      'ratingDt',
      'tsPriceConditionStatus',
      'tsPriceConditionEndDt',
    ]);
  });

  it('exposes only the approved fields in expanded rows', () => {
    expect(customerTableConfig.detailFields.map(({ field }) => field)).toEqual([
      'kkf',
      'krs',
      'taxID',
      'regon',
      'customerShortName',
      'rmAdvisor',
      'corporateGroupGRID',
      'internalGroupName',
    ]);
  });
});
