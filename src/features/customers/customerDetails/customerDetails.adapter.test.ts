import { describe, expect, it } from 'vitest';
import { customerDetailsResponseFixture } from '@/test/customerDetails.fixtures';
import { mapCustomerDetailsResponse } from './customerDetails.adapter';
import type { CustomerDetailsResponse } from './customerDetails.types';

describe('customer details adapter', () => {
  it('finds the basic-data object by its photographed terminal keys', () => {
    const basicData = customerDetailsResponseFixture.basicData;
    const response: CustomerDetailsResponse = {
      ...customerDetailsResponseFixture,
      basicData: undefined,
      unrelatedDates: { catalogOpenDate: '1999-01-01' },
      customerMasterData: basicData,
    };

    const result = mapCustomerDetailsResponse(response);

    expect(result.basicData).toMatchObject({
      catalogOpenDate: '2014-06-12',
      taxId: '5250000000',
      naicsCode: '331110',
    });
  });

  it('normalizes null response groups without dropping configured fields', () => {
    const response: CustomerDetailsResponse = {
      addresses: null,
      consents: null,
      crs: null,
      fatca: null,
      mifid: null,
      lei: null,
      emir: null,
    };

    const result = mapCustomerDetailsResponse(response);

    expect(result.addresses).toEqual({ mainAddress: null, mailingAddress: null });
    expect(result.consents.outsideBankConsent).toBeNull();
    expect(result.crs.crsStatus).toBeNull();
    expect(result.basicData.catalogOpenDate).toBeNull();
  });
});
