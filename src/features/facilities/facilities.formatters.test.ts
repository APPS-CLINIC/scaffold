import { describe, expect, it } from 'vitest';
import { facilityPreviewSnapshot } from '@/dev/facilities/facilities.fixture';
import { formatFacilityAmount, sumFacilitySummaries } from './facilities.formatters';

describe('Facilities amounts', () => {
  it('formats integer minor units with a currency and keeps zero amounts visible', () => {
    expect(formatFacilityAmount(123456, 'EUR', 'en')).toBe('€1,234.56');
    expect(formatFacilityAmount(0, 'EUR', 'en')).toBe('€0.00');
    expect(formatFacilityAmount(123456, 'PLN', 'pl')).toContain('1234,56');
  });

  it('sums provided group summaries once regardless of the number of descendant facilities', () => {
    const lending = facilityPreviewSnapshot.summaries.filter(
      (summary) => summary.group === 'LENDING',
    );
    expect(sumFacilitySummaries(lending, 'EUR')).toMatchObject({
      currency: 'EUR',
      grantedMinor: 10_000_000,
      utilizedMinor: 2_000_000,
      availableMinor: 8_000_000,
    });
    expect(sumFacilitySummaries(facilityPreviewSnapshot.summaries, 'PLN').grantedMinor).toBe(
      240_000_000,
    );
    expect(sumFacilitySummaries([], 'EUR').grantedMinor).toBe(0);
  });
});
