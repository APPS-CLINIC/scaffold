import type {
  CustomerAddress,
  CustomerAddresses,
  CustomerAdvisors,
  CustomerAdvisorsResponse,
  CustomerBasicData,
  CustomerConsents,
  CustomerCrs,
  CustomerDetails,
  CustomerDetailsResponse,
  CustomerEmir,
  CustomerFatca,
  CustomerLei,
  CustomerMifid,
} from './customerDetails.types';

const EMPTY_ADDRESS: CustomerAddress = { street: null, city: null, postalCode: null };
const EMPTY_ADDRESSES: CustomerAddresses = { mainAddress: null, mailingAddress: null };
const EMPTY_CONSENTS: CustomerConsents = {
  electronicBskMarketingConsent: null,
  bskTransferConsent: null,
  nvTransferConsent: null,
  traditionalBskMarketingConsent: null,
  udbTransferConsent: null,
  fromIngLeaseConsent: null,
  toIngLeaseConsent: null,
  fromCommercialFinanceConsent: null,
  toCommercialFinanceConsent: null,
  outsideBankConsent: null,
};
const EMPTY_CRS: CustomerCrs = {
  crsStatus: null,
  crsProcessType: null,
  crsReviewDate: null,
  crsClassificationDate: null,
};
const EMPTY_FATCA: CustomerFatca = {
  fatcaStatus: null,
  fatcaClassificationDate: null,
  fatcaReviewDate: null,
  fatcaReviewType: null,
};
const EMPTY_MIFID: CustomerMifid = {
  mifidClassification: null,
};
const EMPTY_LEI: CustomerLei = { leiCode: null, leiCodeValidityDate: null };
const EMPTY_EMIR: CustomerEmir = { emirClassification: null };

const EMPTY_ADVISORS: CustomerAdvisors = {
  rmAdvisor: null,
  lendingAdvisor: null,
  sfAdvisor: null,
  pcmAdvisor: null,
  fmAdvisor: null,
  tsAdvisor: null,
  ebdAdvisor: null,
  implementationAdvisor: null,
  customerServiceAdvisor: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(source: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

/**
 * Locates the basic-data group by its `catalogOpenDate` and `reviewExtensionDate` keys,
 * whether it sits at the top level or under a wrapper object.
 */
function findBasicDataSource(response: CustomerDetailsResponse): Record<string, unknown> {
  if ('catalogOpenDate' in response && 'reviewExtensionDate' in response) return response;

  for (const candidate of Object.values(response)) {
    if (
      isRecord(candidate) &&
      'catalogOpenDate' in candidate &&
      'reviewExtensionDate' in candidate
    ) {
      return candidate;
    }
  }

  return {};
}

function mapBasicData(response: CustomerDetailsResponse): CustomerBasicData {
  const source = findBasicDataSource(response);

  return {
    catalogOpenDate: readText(source, ['catalogOpenDate']),
    taxId: readText(source, ['taxId', 'nip']),
    regon: readText(source, ['regon']),
    krs: readText(source, ['krs']),
    residenceCountry: readText(source, [
      'residenceCountry',
      'residencyCountry',
      'countryOfResidence',
    ]),
    registrationCountry: readText(source, ['registrationCountry', 'countryOfRegistration']),
    customerType: readText(source, ['customerType', 'type']),
    sector: readText(source, ['sector']),
    subSector: readText(source, ['subSector', 'subsector']),
    nbpEntityType: readText(source, ['nbpEntityType']),
    nbpEntityTypeDescription: readText(source, ['nbpEntityTypeDescription', 'nbpEntityTypeDesc']),
    naicsCode: readText(source, ['naicsCode']),
    naicsName: readText(source, ['naicsName']),
  };
}

function mapAddress(value: CustomerAddress | null): CustomerAddress | null {
  return value ? { ...EMPTY_ADDRESS, ...value } : null;
}

/** Normalize nullable nested response groups into a stable configuration source. */
export function mapCustomerDetailsResponse(response: CustomerDetailsResponse): CustomerDetails {
  const addresses = response.addresses ?? EMPTY_ADDRESSES;

  return {
    basicData: mapBasicData(response),
    addresses: {
      ...EMPTY_ADDRESSES,
      ...addresses,
      mainAddress: mapAddress(addresses.mainAddress),
      mailingAddress: mapAddress(addresses.mailingAddress),
    },
    consents: { ...EMPTY_CONSENTS, ...(response.consents ?? {}) },
    crs: { ...EMPTY_CRS, ...(response.crs ?? {}) },
    fatca: { ...EMPTY_FATCA, ...(response.fatca ?? {}) },
    mifid: { ...EMPTY_MIFID, ...(response.mifid ?? {}) },
    lei: { ...EMPTY_LEI, ...(response.lei ?? {}) },
    emir: { ...EMPTY_EMIR, ...(response.emir ?? {}) },
  };
}

/** Fills in omitted advisor fields so every configured row exists. */
export function mapCustomerAdvisorsResponse(response: CustomerAdvisorsResponse): CustomerAdvisors {
  return { ...EMPTY_ADVISORS, ...response };
}

/** Reserved layout for every General data / CDD row while a customer's request is unresolved. */
export const EMPTY_CUSTOMER_DETAILS: CustomerDetails = mapCustomerDetailsResponse({
  addresses: null,
  consents: null,
  crs: null,
  fatca: null,
  mifid: null,
  lei: null,
  emir: null,
});

export const EMPTY_CUSTOMER_ADVISORS: CustomerAdvisors = { ...EMPTY_ADVISORS };
