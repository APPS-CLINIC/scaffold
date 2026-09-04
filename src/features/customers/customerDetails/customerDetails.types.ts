/** A nullable backend text field. Empty values stay visible as an en dash. */
export type CustomerDetailText = string | null;

export interface CustomerAddress {
  street: CustomerDetailText;
  city: CustomerDetailText;
  postalCode: CustomerDetailText;
}

export interface CustomerAddresses {
  mainAddress: CustomerAddress | null;
  mailingAddress: CustomerAddress | null;
}

export interface CustomerConsents {
  electronicBskMarketingConsent: boolean | null;
  bskTransferConsent: boolean | null;
  nvTransferConsent: boolean | null;
  traditionalBskMarketingConsent: boolean | null;
  udbTransferConsent: boolean | null;
  fromIngLeaseConsent: boolean | null;
  toIngLeaseConsent: boolean | null;
  fromCommercialFinanceConsent: boolean | null;
  toCommercialFinanceConsent: boolean | null;
  outsideBankConsent: boolean | null;
}

export interface CustomerCrs {
  crsStatus: CustomerDetailText;
  crsProcessType: CustomerDetailText;
  crsReviewDate: CustomerDetailText;
  crsClassificationDate: CustomerDetailText;
}

export interface CustomerFatca {
  fatcaStatus: CustomerDetailText;
  fatcaClassificationDate: CustomerDetailText;
  fatcaReviewDate: CustomerDetailText;
  fatcaReviewType: CustomerDetailText;
}

export interface CustomerMifid {
  mifidClassification: CustomerDetailText;
}

export interface CustomerLei {
  leiCode: CustomerDetailText;
  leiCodeValidityDate: CustomerDetailText;
}

export interface CustomerEmir {
  emirClassification: CustomerDetailText;
}

/** Stable app-facing shape for the basic-data object whose wrapper is transport-specific. */
export interface CustomerBasicData {
  catalogOpenDate: CustomerDetailText;
  taxId: CustomerDetailText;
  regon: CustomerDetailText;
  krs: CustomerDetailText;
  residenceCountry: CustomerDetailText;
  registrationCountry: CustomerDetailText;
  customerType: CustomerDetailText;
  sector: CustomerDetailText;
  subSector: CustomerDetailText;
  nbpEntityType: CustomerDetailText;
  nbpEntityTypeDescription: CustomerDetailText;
  naicsCode: CustomerDetailText;
  naicsName: CustomerDetailText;
}

/**
 * Payload from `GET /api/v1/customers/{id}`.
 *
 * The basic-data group arrives either at the top level or inside a wrapper object whose key
 * is not fixed by the contract. The index signature admits that wrapper; the adapter locates
 * the group by its content and maps it to `CustomerBasicData`.
 */
export interface CustomerDetailsResponse {
  [property: string]: unknown;
  addresses: CustomerAddresses | null;
  consents: CustomerConsents | null;
  crs: CustomerCrs | null;
  fatca: CustomerFatca | null;
  mifid: CustomerMifid | null;
  lei: CustomerLei | null;
  emir: CustomerEmir | null;
}

/** Normalized view model: every configured group exists even when the API value is null. */
export interface CustomerDetails {
  basicData: CustomerBasicData;
  addresses: CustomerAddresses;
  consents: CustomerConsents;
  crs: CustomerCrs;
  fatca: CustomerFatca;
  mifid: CustomerMifid;
  lei: CustomerLei;
  emir: CustomerEmir;
}

/** Exact response from `GET /api/v1/customers/{id}/advisors`. */
export interface CustomerAdvisorsResponse {
  rmAdvisor: CustomerDetailText;
  lendingAdvisor: CustomerDetailText;
  sfAdvisor: CustomerDetailText;
  pcmAdvisor: CustomerDetailText;
  fmAdvisor: CustomerDetailText;
  tsAdvisor: CustomerDetailText;
  ebdAdvisor: CustomerDetailText;
  implementationAdvisor: CustomerDetailText;
  customerServiceAdvisor: CustomerDetailText;
}

export type CustomerAdvisors = CustomerAdvisorsResponse;
