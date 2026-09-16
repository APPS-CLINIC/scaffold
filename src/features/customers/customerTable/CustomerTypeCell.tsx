import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import type { GenericDataTableCellProps } from '@/ui';
import type { Customer, CustomerType } from '../customers.types';

/** One translation per enum value; a value without a key is a compile error. */
const labelKeyByCustomerType: Readonly<Record<CustomerType, MessageKey>> = {
  CORPORATE: 'customers.type.corporate',
  CORPORATE_STRUCTURED_FINANCE: 'customers.type.corporateStructuredFinance',
  INSTFIN_INVESTMENT_BANK: 'customers.type.instFinInvestmentBank',
  INSTFIN_NON_INVESTMENT_BANK: 'customers.type.instFinNonInvestmentBank',
  INSTFIN_BROKERAGE_HOUSE: 'customers.type.instFinBrokerageHouse',
  INSTFIN_INSURER: 'customers.type.instFinInsurer',
  INSTFIN_LEASING_COMPANY: 'customers.type.instFinLeasingCompany',
  INSTFIN_FACTORING_COMPANY: 'customers.type.instFinFactoringCompany',
  INSTFIN_CLEARING_HOUSE: 'customers.type.instFinClearingHouse',
  INSTFIN_NON_FACTORING_DEBT_TRADING: 'customers.type.instFinNonFactoringDebtTrading',
  INSTFIN_OTHER: 'customers.type.instFinOther',
  INSTFIN_INVESTMENT_FUND_COMPANY: 'customers.type.instFinInvestmentFundCompany',
  INSTFIN_INVESTMENT_FUND: 'customers.type.instFinInvestmentFund',
  CORPORATE_COMMERCIAL_REAL_ESTATE_CONSTRUCTION:
    'customers.type.corporateCommercialRealEstateConstruction',
  CORPORATE_COMMERCIAL_REAL_ESTATE_REFINANCING:
    'customers.type.corporateCommercialRealEstateRefinancing',
  TECHNICAL_RECORD: 'customers.type.technicalRecord',
};

export function CustomerTypeCell({
  value,
  notAvailable,
}: GenericDataTableCellProps<Customer, 'type'>) {
  const { t } = useTranslation();
  return value ? t(labelKeyByCustomerType[value]) : notAvailable;
}
