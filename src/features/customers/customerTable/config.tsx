import type { Customer } from '@/features/customers/customers.types';
import {
  ActiveArchivalStatusCell,
  DateRangeFilter,
  MultiSelectFilter,
  OverdueDateCell,
  tableFilter,
  TextCell,
  TextFilter,
  UnderlinedTextCell,
} from '@/ui';
import type { GenericDataTableConfig } from '@/ui';
import { CustomerDictionaryFilter } from './CustomerDictionaryFilter';
import {
  CUSTOMER_STATUS_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  NO_INTERNAL_GROUP_OPTION,
  TS_PRICE_CONDITION_STATUS_OPTIONS,
} from './filterOptions';

/**
 * One flat field list: every field can be a column, and whatever does not fit
 * the viewport without horizontal scrolling drops into the row accordion (in
 * this order). Widths are pixel budgets for the responsive fit engine. A field
 * with a `filter` gets that control in the filter dialog while the table uses it.
 */
export const customerTableConfig = {
  id: 'customers',
  dataKey: 'id',
  singleRowExpansion: false,
  fields: [
    {
      field: 'fullName',
      labelKey: 'customers.table.field.fullName',
      component: (props) => (
        <UnderlinedTextCell {...props} href={(row) => `/customers/${row.id}`} openInNewTab />
      ),
      sortable: true,
      width: 192,
      alwaysVisible: true,
    },
    { field: 'kkf', labelKey: 'customers.table.field.kkf', sortable: true, width: 112 },
    {
      field: 'status',
      labelKey: 'customers.table.field.status',
      filter: tableFilter(MultiSelectFilter, { options: CUSTOMER_STATUS_OPTIONS }),
      component: ActiveArchivalStatusCell,
      sortable: true,
      width: 112,
    },
    {
      field: 'internalGroupName',
      labelKey: 'customers.table.field.internalGroupName',
      filter: tableFilter(CustomerDictionaryFilter, {
        dictionary: 'internalGroups',
        noneOption: NO_INTERNAL_GROUP_OPTION,
      }),
      filterParam: 'internalGroupId',
      sortable: true,
      width: 192,
    },
    {
      field: 'corporateGroupName',
      labelKey: 'customers.table.field.corporateGroupName',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'corporateGroups' }),
      filterParam: 'corporateGroupId',
      component: UnderlinedTextCell,
      sortable: true,
      width: 160,
    },
    {
      field: 'type',
      labelKey: 'customers.table.field.type',
      filter: tableFilter(MultiSelectFilter, { options: CUSTOMER_TYPE_OPTIONS }),
      component: TextCell,
      sortable: true,
      width: 128,
    },
    {
      field: 'lendingReviewDate',
      labelKey: 'customers.table.field.lendingReviewDate',
      filter: tableFilter(DateRangeFilter, {}),
      component: OverdueDateCell,
      sortable: true,
      width: 160,
    },
    {
      field: 'lendingRatingReviewDate',
      labelKey: 'customers.table.field.lendingRatingReviewDate',
      filter: tableFilter(DateRangeFilter, {}),
      component: OverdueDateCell,
      sortable: true,
      width: 144,
    },
    {
      field: 'lendingRating',
      labelKey: 'customers.table.field.lendingRating',
      filter: tableFilter(TextFilter, {}),
      // The service does not serve this field yet and rejects unknown sort
      // fields with 400, so the header must not offer sorting until it does.
      sortable: false,
      width: 128,
    },
    {
      field: 'tsPriceConditionEndDate',
      labelKey: 'customers.table.field.tsPriceConditionEndDate',
      filter: tableFilter(DateRangeFilter, {}),
      component: OverdueDateCell,
      sortable: true,
      width: 160,
    },
    {
      field: 'tsPriceConditionStatus',
      labelKey: 'customers.table.field.tsPriceConditionStatus',
      filter: tableFilter(MultiSelectFilter, { options: TS_PRICE_CONDITION_STATUS_OPTIONS }),
      component: TextCell,
      sortable: true,
      width: 176,
    },
    {
      field: 'grid',
      labelKey: 'customers.table.field.grid',
      component: TextCell,
      sortable: true,
      width: 96,
    },
    { field: 'taxId', labelKey: 'customers.table.field.taxId', sortable: true, width: 128 },
    { field: 'krs', labelKey: 'customers.table.field.krs', sortable: true, width: 128 },
    { field: 'regon', labelKey: 'customers.table.field.regon', sortable: true, width: 128 },
    {
      field: 'shortName',
      labelKey: 'customers.table.field.shortName',
      sortable: true,
      width: 192,
    },
    {
      field: 'rmAdvisor',
      labelKey: 'customers.table.field.rmAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'rmAdvisors' }),
      sortable: true,
      width: 176,
    },
    {
      field: 'lendingAdvisor',
      labelKey: 'customers.table.field.lendingAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'lendingAdvisors' }),
      sortable: true,
      width: 176,
    },
    {
      field: 'sfAdvisor',
      labelKey: 'customers.table.field.sfAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'sfAdvisors' }),
      sortable: true,
      width: 176,
    },
    {
      field: 'pcmAdvisor',
      labelKey: 'customers.table.field.pcmAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'pcmAdvisors' }),
      sortable: true,
      width: 176,
    },
    {
      field: 'fmAdvisor',
      labelKey: 'customers.table.field.fmAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'fmAdvisors' }),
      sortable: true,
      width: 176,
    },
    {
      field: 'tsAdvisor',
      labelKey: 'customers.table.field.tsAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'tsAdvisors' }),
      sortable: true,
      width: 176,
    },
    {
      field: 'implementationAdvisor',
      labelKey: 'customers.table.field.implementationAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'implementationAdvisors' }),
      sortable: true,
      width: 192,
    },
    {
      field: 'customerServiceAdvisor',
      labelKey: 'customers.table.field.customerServiceAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'customerServiceAdvisors' }),
      sortable: true,
      width: 192,
    },
    {
      field: 'ebdAdvisor',
      labelKey: 'customers.table.field.ebdAdvisor',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'ebdAdvisors' }),
      sortable: true,
      width: 176,
    },
    {
      field: 'lendingTeam',
      labelKey: 'customers.table.field.lendingTeam',
      filter: tableFilter(CustomerDictionaryFilter, { dictionary: 'lendingTeams' }),
      // Same as lendingRating: unsortable until the service serves the field.
      sortable: false,
      width: 176,
    },
  ],
} satisfies GenericDataTableConfig<Customer>;
