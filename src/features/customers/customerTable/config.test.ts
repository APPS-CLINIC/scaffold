import { describe, expect, it } from 'vitest';
import { customerTableConfig } from './config';
import { OverdueDateCell } from './OverdueDateCell';

describe('customerTableConfig', () => {
  it('identifies the table so its settings can be persisted', () => {
    expect(customerTableConfig.id).toBe('customers');
  });

  it('keeps the reference field order explicit', () => {
    expect(customerTableConfig.fields.map(({ field }) => field)).toEqual([
      'fullName',
      'kkf',
      'status',
      'internalGroupName',
      'corporateGroupName',
      'type',
      'lendingReviewDate',
      'lendingRatingReviewDate',
      'lendingRating',
      'tsPriceConditionEndDate',
      'tsPriceConditionStatus',
      'grid',
      'taxId',
      'krs',
      'regon',
      'shortName',
      'rmAdvisor',
      'lendingAdvisor',
      'sfAdvisor',
      'pcmAdvisor',
      'fmAdvisor',
      'tsAdvisor',
      'implementationAdvisor',
      'customerServiceAdvisor',
      'ebdAdvisor',
      'lendingTeam',
    ]);
  });

  it('gives every field the same config shape the fit engine needs', () => {
    for (const field of customerTableConfig.fields) {
      expect(field.width).toBeGreaterThan(0);
      expect(field.labelKey).toBe(`customers.table.field.${field.field}`);
      expect(field.sortable).toBe(true);
    }
  });

  it('marks the review and pricing dates as overdue-aware', () => {
    const overdueFields = customerTableConfig.fields
      .filter((field) => field.component === OverdueDateCell)
      .map(({ field }) => field);
    expect(overdueFields).toEqual([
      'lendingReviewDate',
      'lendingRatingReviewDate',
      'tsPriceConditionEndDate',
    ]);
  });

  it('pins only the customer name so it can never drop into the accordion', () => {
    const pinned = customerTableConfig.fields.filter((field) => field.alwaysVisible);
    expect(pinned.map(({ field }) => field)).toEqual(['fullName']);
  });
});
