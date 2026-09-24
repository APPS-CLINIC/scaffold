import type { CustomerSectionPart } from './CustomerPartsCard';

export type CustomerFmDataPart = CustomerSectionPart;

/**
 * Parts of the FM data section, in menu order. They are not navigation-manifest items:
 * the menu lives inside the page, below the customer sidebar item it belongs to. The
 * segment is the last URL segment, so a part survives a reload and a shared link.
 */
export const CUSTOMER_FM_DATA_PARTS = [
  { id: 'basic-data', segment: 'basic-data', labelKey: 'customers.details.fmData.part.basicData' },
  { id: 'mandates', segment: 'mandates', labelKey: 'customers.details.fmData.part.mandates' },
  { id: 'contracts', segment: 'contracts', labelKey: 'customers.details.fmData.part.contracts' },
  { id: 'proxies', segment: 'proxies', labelKey: 'customers.details.fmData.part.proxies' },
] as const satisfies readonly CustomerFmDataPart[];

export const DEFAULT_CUSTOMER_FM_DATA_PART = CUSTOMER_FM_DATA_PARTS[0];

export function findCustomerFmDataPart(segment: string): CustomerFmDataPart | undefined {
  return CUSTOMER_FM_DATA_PARTS.find((part) => part.segment === segment);
}
