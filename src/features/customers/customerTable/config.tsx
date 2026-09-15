import type { Customer } from '@/features/customers/customers.types';
import {
  ActiveArchivalStatusCell,
  DateCell,
  TextCell,
  UnderlinedTextCell,
  ValidityStatusCell,
} from '@/ui';
import type { GenericDataTableConfig } from '@/ui';

/**
 * One flat field list: every field can be a column, and whatever does not fit
 * the viewport without horizontal scrolling drops into the row accordion (in
 * this order). Widths are pixel budgets for the responsive fit engine.
 */
export const customerTableConfig = {
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
    {
      field: 'grid',
      labelKey: 'customers.table.field.grid',
      component: TextCell,
      sortable: true,
      width: 96,
    },
    {
      field: 'status',
      labelKey: 'customers.table.field.status',
      component: ActiveArchivalStatusCell,
      sortable: true,
      width: 112,
    },
    {
      field: 'corporateGroupName',
      labelKey: 'customers.table.field.corporateGroupName',
      component: UnderlinedTextCell,
      sortable: true,
      width: 160,
    },
    {
      field: 'type',
      labelKey: 'customers.table.field.type',
      component: TextCell,
      sortable: true,
      width: 128,
    },
    {
      field: 'lendingRatingReviewDate',
      labelKey: 'customers.table.field.lendingRatingReviewDate',
      component: DateCell,
      sortable: true,
      width: 144,
    },
    {
      field: 'tsPriceConditionEndDate',
      labelKey: 'customers.table.field.tsPriceConditionEndDate',
      component: DateCell,
      sortable: true,
      width: 160,
    },
    {
      field: 'tsPriceConditionStatus',
      labelKey: 'customers.table.field.tsPriceConditionStatus',
      component: ValidityStatusCell,
      sortable: true,
      width: 176,
    },
    {
      field: 'lendingReviewDate',
      labelKey: 'customers.table.field.lendingReviewDate',
      component: DateCell,
      sortable: true,
      width: 160,
    },
    { field: 'kkf', labelKey: 'customers.table.field.kkf', sortable: true, width: 112 },
    { field: 'krs', labelKey: 'customers.table.field.krs', sortable: true, width: 128 },
    { field: 'taxId', labelKey: 'customers.table.field.taxId', sortable: true, width: 128 },
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
      sortable: true,
      width: 176,
    },
    {
      field: 'corporateGroupGRID',
      labelKey: 'customers.table.field.corporateGroupGRID',
      sortable: true,
      width: 160,
    },
    {
      field: 'internalGroupName',
      labelKey: 'customers.table.field.internalGroupName',
      sortable: true,
      width: 192,
    },
    {
      field: 'lendingAdvisor',
      labelKey: 'customers.table.field.lendingAdvisor',
      sortable: true,
      width: 176,
    },
    {
      field: 'sfAdvisor',
      labelKey: 'customers.table.field.sfAdvisor',
      sortable: true,
      width: 176,
    },
    {
      field: 'pcmAdvisor',
      labelKey: 'customers.table.field.pcmAdvisor',
      sortable: true,
      width: 176,
    },
    {
      field: 'fmAdvisor',
      labelKey: 'customers.table.field.fmAdvisor',
      sortable: true,
      width: 176,
    },
    {
      field: 'tsAdvisor',
      labelKey: 'customers.table.field.tsAdvisor',
      sortable: true,
      width: 176,
    },
    {
      field: 'ebdAdvisor',
      labelKey: 'customers.table.field.ebdAdvisor',
      sortable: true,
      width: 176,
    },
    {
      field: 'implementationAdvisor',
      labelKey: 'customers.table.field.implementationAdvisor',
      sortable: true,
      width: 192,
    },
    {
      field: 'customerServiceAdvisor',
      labelKey: 'customers.table.field.customerServiceAdvisor',
      sortable: true,
      width: 192,
    },
  ],
} satisfies GenericDataTableConfig<Customer>;
