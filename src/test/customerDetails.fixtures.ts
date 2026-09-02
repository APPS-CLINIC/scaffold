import type {
  CustomerAdvisorsResponse,
  CustomerDetailsResponse,
} from '@/features/customers/customerDetails/customerDetails.types';

export const customerDetailsResponseFixture: CustomerDetailsResponse = {
  basicData: {
    catalogOpenDate: '2014-06-12',
    reviewExtensionDate: null,
    taxId: '5250000000',
    regon: '012345678',
    krs: '0000123456',
    residenceCountry: 'Poland',
    registrationCountry: 'Poland',
    customerType: 'Corporate',
    sector: 'Industry',
    subSector: 'Steel production',
    nbpEntityType: 'Non-financial corporation',
    nbpEntityTypeDescription: 'Private corporation',
    naicsCode: '331110',
    naicsName: 'Iron and steel mills and ferroalloy manufacturing',
  },
  addresses: {
    mainAddress: {
      street: 'Main Street 123',
      city: 'Warsaw',
      postalCode: '00-001',
    },
    mailingAddress: {
      street: 'Main Street 123',
      city: 'Warsaw',
      postalCode: '00-001',
    },
  },
  consents: {
    electronicBskMarketingConsent: true,
    bskTransferConsent: true,
    nvTransferConsent: false,
    traditionalBskMarketingConsent: true,
    udbTransferConsent: false,
    fromIngLeaseConsent: false,
    toIngLeaseConsent: true,
    fromCommercialFinanceConsent: false,
    toCommercialFinanceConsent: true,
    outsideBankConsent: true,
  },
  crs: {
    crsStatus: 'Completed',
    crsProcessType: 'Review',
    crsReviewDate: '2026-12-12',
    crsClassificationDate: '2025-08-30',
  },
  fatca: {
    fatcaStatus: 'Completed',
    fatcaClassificationDate: '2025-08-30',
    fatcaReviewDate: '2026-08-31',
    fatcaReviewType: 'Periodic',
  },
  mifid: {
    mifidClassification: 'Professional',
  },
  lei: {
    leiCode: '5493001KJTIIGC8Y1R12',
    leiCodeValidityDate: '2026-12-31',
  },
  emir: {
    emirClassification: 'NFC+',
  },
};

export const customerAdvisorsResponseFixture: CustomerAdvisorsResponse = {
  rmAdvisor: 'Alex Morgan',
  lendingAdvisor: 'Taylor Reed',
  sfAdvisor: 'Jordan Blake',
  pcmAdvisor: 'Casey Quinn',
  fmAdvisor: 'Morgan Lee',
  tsAdvisor: 'Riley Parker',
  ebdAdvisor: 'Jamie Brooks',
  implementationAdvisor: 'Avery Collins',
  customerServiceAdvisor: 'Cameron Hayes',
};
