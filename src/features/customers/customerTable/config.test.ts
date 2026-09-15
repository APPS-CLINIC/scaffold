import { describe, expect, it } from 'vitest';
import { customerTableConfig } from './config';

describe('customerTableConfig', () => {
  it('identifies the table so its settings can be persisted', () => {
    expect(customerTableConfig.id).toBe('customers');
  });

  it('keeps the reference field order explicit', () => {
    expect(customerTableConfig.fields.map(({ field }) => field)).toEqual([
      'fullName',
      'grid',
      'status',
      'corporateGroupName',
      'type',
      'lendingRatingReviewDate',
      'tsPriceConditionEndDate',
      'tsPriceConditionStatus',
      'lendingReviewDate',
      'kkf',
      'krs',
      'taxId',
      'regon',
      'shortName',
      'rmAdvisor',
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

  it('gives every field the same config shape the fit engine needs', () => {
    for (const field of customerTableConfig.fields) {
      expect(field.width).toBeGreaterThan(0);
      expect(field.labelKey).toBe(`customers.table.field.${field.field}`);
      expect(field.sortable).toBe(true);
    }
  });

  it('pins only the customer name so it can never drop into the accordion', () => {
    const pinned = customerTableConfig.fields.filter((field) => field.alwaysVisible);
    expect(pinned.map(({ field }) => field)).toEqual(['fullName']);
  });
});
