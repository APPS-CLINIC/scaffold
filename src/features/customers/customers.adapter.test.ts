import { describe, expect, it } from 'vitest';
import { pl } from '@/i18n/messages/pl';
import { mapCustomerResponse } from './customers.adapter';
import type { CustomerResponse } from './customers.types';

const response: CustomerResponse = {
  id: 23997,
  fullName: 'ARCELORMITTAL WARSZAWA SP. Z O.O.',
  shortName: 'ARCELORMITTAL WARSZAWA SP. Z O.O.',
  grid: '46034616',
  corporateGroupId: 1739,
  corporateGroupName: 'Arcelormittal SA',
  internalGroupId: 53,
  internalGroupName: 'ArcelorMittal',
  kkf: '2203666408',
  krs: '43770',
  taxId: '1180016775',
  regon: '10592085',
  rmAdvisor: 'Merta Katarzyna',
  lendingAdvisor: 'Drewniak Dariusz',
  sfAdvisor: null,
  pcmAdvisor: 'Drenda Dariusz',
  fmAdvisor: 'Weryk Bartosz',
  tsAdvisor: 'Drenda Dariusz',
  ebdAdvisor: 'Korniluk Piotr',
  implementationAdvisor: 'Barylska Ewelina',
  customerServiceAdvisor: 'Boguta Magdalena',
  lendingTeam: 'Zespół Warszawa',
  extensionReviewDate: null,
  lendingReviewDate: '2026-02-10',
  lendingRatingDate: '2025-12-18',
  lendingRatingReviewDate: '2025-12-18',
  lendingRating: 'BBB-',
  tsPriceConditionEndDate: null,
  tsPriceConditionStatus: null,
  type: 'Corporate',
  status: 'ACTIVE',
};

describe('customer response adapter', () => {
  it('normalizes backend status and type values without renaming response fields', () => {
    expect(mapCustomerResponse({ ...response, tsPriceConditionStatus: 2 })).toMatchObject({
      fullName: response.fullName,
      taxId: response.taxId,
      status: 'ACTIVE',
      type: 'CORPORATE',
      tsPriceConditionStatus: 2,
    });
  });

  it('maps the archival status and the customer type case-insensitively', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: ' Archival ',
        type: ' corporate ',
      }),
    ).toMatchObject({ status: 'ARCHIVAL', type: 'CORPORATE' });
  });

  it('maps every warehouse customer type label to its contract value', () => {
    const typeOf = (type: string) => mapCustomerResponse({ ...response, type }).type;

    expect(typeOf('Corporate_(FinansStrukturalne)')).toBe('CORPORATE_STRUCTURED_FINANCE');
    expect(typeOf('InstFin_Bank Inwestycyjny')).toBe('INSTFIN_INVESTMENT_BANK');
    expect(typeOf('InstFin_Bank n/Inwestycyjny')).toBe('INSTFIN_NON_INVESTMENT_BANK');
    expect(typeOf('InstFin_Dom makl/Broker')).toBe('INSTFIN_BROKERAGE_HOUSE');
    expect(typeOf('InstFin_Ubezpieczyciel')).toBe('INSTFIN_INSURER');
    expect(typeOf('InstFin_F.Leasingowa')).toBe('INSTFIN_LEASING_COMPANY');
    expect(typeOf('InstFin_F.Faktoringowa')).toBe('INSTFIN_FACTORING_COMPANY');
    expect(typeOf('InstFin_IzbaRozliczeniowa')).toBe('INSTFIN_CLEARING_HOUSE');
    expect(typeOf('InstFin_F.ObrWierzyt n/factoring')).toBe('INSTFIN_NON_FACTORING_DEBT_TRADING');
    expect(typeOf('InstFin_InnaInstFin')).toBe('INSTFIN_OTHER');
    expect(typeOf('InstFin_TFI')).toBe('INSTFIN_INVESTMENT_FUND_COMPANY');
    expect(typeOf('InstFin_Fund.Inwestycyjny')).toBe('INSTFIN_INVESTMENT_FUND');
    expect(typeOf('Corporate_(FinansNieruchKomerc_Constr)')).toBe(
      'CORPORATE_COMMERCIAL_REAL_ESTATE_CONSTRUCTION',
    );
    expect(typeOf('Corporate_(FinansNieruchKomerc_Refinans)')).toBe(
      'CORPORATE_COMMERCIAL_REAL_ESTATE_REFINANCING',
    );
    expect(typeOf('Kartoteka techniczna')).toBe('TECHNICAL_RECORD');
  });

  it('rejects labels outside the English-only contract', () => {
    // Polish labels are no longer part of the backend contract.
    expect(
      mapCustomerResponse({
        ...response,
        status: pl['common.status.active'],
        type: 'Korporacyjny',
      }),
    ).toMatchObject({ status: null, type: null });

    expect(
      mapCustomerResponse({
        ...response,
        status: 'unexpected',
        type: 'unexpected',
      }),
    ).toMatchObject({ status: null, type: null });
  });

  it('rejects labels that collide with Object.prototype members', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: 'constructor',
        type: ' __proto__ ',
      }),
    ).toMatchObject({ status: null, type: null });
  });

  it('degrades non-string payload values to null instead of crashing', () => {
    expect(
      mapCustomerResponse({
        ...response,
        status: 42 as unknown as string,
        type: {} as unknown as string,
      }),
    ).toMatchObject({ status: null, type: null });
  });
});
