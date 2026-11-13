import type { FacilityAmounts, FacilityCurrency, FacilityGroupSummary } from './facilities.types';

export function formatFacilityAmount(
  minor: number,
  currency: FacilityCurrency,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

/** Use supplied group totals, never the amounts of parents plus their children. */
export function sumFacilitySummaries(
  summaries: readonly FacilityGroupSummary[],
  currency: FacilityCurrency,
): FacilityAmounts {
  const result = summaries.reduce(
    (sum, summary) => {
      const amounts = summary.amounts[currency];
      return {
        currency,
        grantedMinor: sum.grantedMinor + amounts.grantedMinor,
        utilizedMinor: sum.utilizedMinor + amounts.utilizedMinor,
        availableMinor: sum.availableMinor + amounts.availableMinor,
        utilization: null,
      };
    },
    {
      currency,
      grantedMinor: 0,
      utilizedMinor: 0,
      availableMinor: 0,
      utilization: null,
    } as FacilityAmounts,
  );
  return result;
}
