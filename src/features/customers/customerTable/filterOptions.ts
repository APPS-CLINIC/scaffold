import type { MessageKey } from '@/i18n/messages/pl';
import type { TableFilterOption } from '@/ui';
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  TS_PRICE_CONDITION_STATUSES,
  type CustomerStatus,
  type CustomerType,
  type TsPriceConditionStatus,
} from '../customers.types';

const statusLabelKeys: Record<CustomerStatus, MessageKey> = {
  ACTIVE: 'common.status.active',
  ARCHIVAL: 'common.status.archival',
};

const typeLabelKeys: Record<CustomerType, MessageKey> = {
  CORPORATE: 'customers.type.corporate',
  CORPORATE_STRUCTURED_FINANCE: 'customers.type.corporateStructuredFinance',
  INVESTMENT_BANK: 'customers.type.investmentBank',
  NON_INVESTMENT_BANK: 'customers.type.nonInvestmentBank',
  BROKERAGE_HOUSE: 'customers.type.brokerageHouse',
  INSURANCE_COMPANY: 'customers.type.insuranceCompany',
  LEASING_COMPANY: 'customers.type.leasingCompany',
  FACTORING_COMPANY: 'customers.type.factoringCompany',
  CLEARING_HOUSE: 'customers.type.clearingHouse',
  RECEIVABLES_TRADING_COMPANY: 'customers.type.receivablesTradingCompany',
  OTHER_FINANCIAL_INSTITUTION: 'customers.type.otherFinancialInstitution',
  INVESTMENT_FUND_MANAGEMENT_COMPANY: 'customers.type.investmentFundManagementCompany',
  INVESTMENT_FUND: 'customers.type.investmentFund',
  COMMERCIAL_REAL_ESTATE_CONSTRUCTION_FINANCE:
    'customers.type.commercialRealEstateConstructionFinance',
  COMMERCIAL_REAL_ESTATE_REFINANCING: 'customers.type.commercialRealEstateRefinancing',
  TECHNICAL_RECORD: 'customers.type.technicalRecord',
};

const tsPriceConditionStatusLabelKeys: Record<TsPriceConditionStatus, MessageKey> = {
  STANDARD_CONTRACT_END_DATE: 'customers.tsPriceConditionStatus.standardContractEndDate',
  NON_STANDARD_CONTRACT_END_DATE: 'customers.tsPriceConditionStatus.nonStandardContractEndDate',
  NO_CONTRACT_END_DATE: 'customers.tsPriceConditionStatus.noContractEndDate',
};

export const CUSTOMER_STATUS_OPTIONS: readonly TableFilterOption[] = CUSTOMER_STATUSES.map(
  (value) => ({ value, labelKey: statusLabelKeys[value] }),
);

export const CUSTOMER_TYPE_OPTIONS: readonly TableFilterOption[] = CUSTOMER_TYPES.map((value) => ({
  value,
  labelKey: typeLabelKeys[value],
}));

export const TS_PRICE_CONDITION_STATUS_OPTIONS: readonly TableFilterOption[] =
  TS_PRICE_CONDITION_STATUSES.map((value) => ({
    value,
    labelKey: tsPriceConditionStatusLabelKeys[value],
  }));

/** The own-group choice for customers without an own group. */
export const NO_INTERNAL_GROUP_OPTION: TableFilterOption = {
  value: 'NONE',
  labelKey: 'customers.filters.noInternalGroup',
};
