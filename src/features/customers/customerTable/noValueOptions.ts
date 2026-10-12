import type { TableFilterOption } from '@/ui';
import { NO_VALUE } from '../customers.types';

/** The choices for customers without a value in the field, first in their lists. */
export const NO_INTERNAL_GROUP_OPTION: TableFilterOption = {
  value: NO_VALUE,
  labelKey: 'customers.filters.noInternalGroup',
};

export const NO_CORPORATE_GROUP_OPTION: TableFilterOption = {
  value: NO_VALUE,
  labelKey: 'customers.filters.noCorporateGroup',
};

export const NO_ADVISOR_OPTION: TableFilterOption = {
  value: NO_VALUE,
  labelKey: 'customers.filters.noAdvisor',
};

export const NO_TS_PRICE_CONDITION_STATUS_OPTION: TableFilterOption = {
  value: NO_VALUE,
  labelKey: 'customers.filters.noTsPriceConditionStatus',
};
