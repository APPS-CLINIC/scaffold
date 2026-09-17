import type { Customer } from '@/features/customers/customers.types';
import { ActiveArchivalStatusCell, OverdueDateCell, TextCell, UnderlinedTextCell } from '@/ui';
import type { GenericDataTableConfig } from '@/ui';
import { CustomerTypeCell } from './CustomerTypeCell';

/**
 * One flat field list: every field can be a column, and whatever does not fit
 * the viewport without horizontal scrolling drops into the row accordion (in
 * this order). Widths are pixel budgets for the responsive fit engine.
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
      component: ActiveArchivalStatusCell,
      sortable: true,
      width: 112,
    },
    {
      field: 'internalGroupName',
      labelKey: 'customers.table.field.internalGroupName',
      sortable: true,
      width: 192,
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
      component: CustomerTypeCell,
      sortable: true,
      width: 128,
    },
    {
      field: 'lendingReviewDate',
      labelKey: 'customers.table.field.lendingReviewDate',
      component: OverdueDateCell,
      sortable: true,
      width: 160,
    },
    {
      field: 'lendingRatingReviewDate',
      labelKey: 'customers.table.field.lendingRatingReviewDate',
      component: OverdueDateCell,
      sortable: true,
      width: 144,
    },
    {
      field: 'lendingRating',
      labelKey: 'customers.table.field.lendingRating',
      // The service does not serve this field yet and rejects unknown sort
      // fields with 400, so the header must not offer sorting until it does.
      sortable: false,
      width: 128,
    },
    {
      field: 'tsPriceConditionEndDate',
      labelKey: 'customers.table.field.tsPriceConditionEndDate',
      component: OverdueDateCell,
      sortable: true,
      width: 160,
    },
    {
      field: 'tsPriceConditionStatus',
      labelKey: 'customers.table.field.tsPriceConditionStatus',
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
      sortable: true,
      width: 176,
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
    {
      field: 'ebdAdvisor',
      labelKey: 'customers.table.field.ebdAdvisor',
      sortable: true,
      width: 176,
    },
    {
      field: 'lendingTeam',
      labelKey: 'customers.table.field.lendingTeam',
      // Same as lendingRating: unsortable until the service serves the field.
      sortable: false,
      width: 176,
    },
  ],
} satisfies GenericDataTableConfig<Customer>;
