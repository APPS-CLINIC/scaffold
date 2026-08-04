import type { GenericDataTableConfig } from '@/ui';
import {
  CustomerDateCell,
  CustomerGridCell,
  CustomerGroupCell,
  CustomerNameCell,
  CustomerPriceConditionCell,
  CustomerSectorCell,
  CustomerStatusCell,
} from './customerTable.cells';
import type { Customer } from './customers.types';

export const customerTableConfig = {
  dataKey: 'id',
  singleRowExpansion: true,
  columns: [
    {
      field: 'customerFullName',
      headerKey: 'customers.table.column.name',
      component: CustomerNameCell,
      sortable: true,
      headerClassName: 'min-w-64',
      cellClassName: 'min-w-64 whitespace-normal',
    },
    {
      field: 'grid',
      headerKey: 'customers.table.column.grid',
      component: CustomerGridCell,
      sortable: true,
      headerClassName: 'min-w-32',
    },
    {
      field: 'customerStatus',
      headerKey: 'customers.table.column.status',
      component: CustomerStatusCell,
      sortable: true,
      headerClassName: 'min-w-36',
    },
    {
      field: 'corporateGroupName',
      headerKey: 'customers.table.column.group',
      component: CustomerGroupCell,
      sortable: true,
      headerClassName: 'min-w-52',
      cellClassName: 'min-w-52 whitespace-normal',
    },
    {
      field: 'customerSector',
      headerKey: 'customers.table.column.sector',
      component: CustomerSectorCell,
      sortable: true,
      headerClassName: 'min-w-40',
    },
    {
      field: 'dateReview',
      headerKey: 'customers.table.column.reviewDate',
      component: CustomerDateCell,
      sortable: true,
      headerClassName: 'min-w-40',
    },
    {
      field: 'ratingDt',
      headerKey: 'customers.table.column.ratingDate',
      component: CustomerDateCell,
      sortable: true,
      headerClassName: 'min-w-52',
    },
  ],
  detailFields: [
    { field: 'customerShortName', labelKey: 'customers.table.detail.shortName' },
    { field: 'corporateGroupId', labelKey: 'customers.table.detail.corporateGroupId' },
    { field: 'corporateGroupGRID', labelKey: 'customers.table.detail.corporateGroupGrid' },
    { field: 'internalGroupId', labelKey: 'customers.table.detail.internalGroupId' },
    { field: 'internalGroupName', labelKey: 'customers.table.detail.internalGroupName' },
    { field: 'kkf', labelKey: 'customers.table.detail.kkf' },
    { field: 'krs', labelKey: 'customers.table.detail.krs' },
    { field: 'taxID', labelKey: 'customers.table.detail.taxId' },
    { field: 'regon', labelKey: 'customers.table.detail.regon' },
    { field: 'rmAdvisor', labelKey: 'customers.table.detail.rmAdvisor' },
    {
      field: 'dateReviewExtension',
      labelKey: 'customers.table.detail.reviewExtension',
      component: CustomerDateCell,
    },
    {
      field: 'tsPriceConditionEndDt',
      labelKey: 'customers.table.detail.priceConditionEndDate',
      component: CustomerDateCell,
    },
    {
      field: 'tsPriceConditionStatus',
      labelKey: 'customers.table.detail.priceConditionStatus',
      component: CustomerPriceConditionCell,
    },
  ],
} satisfies GenericDataTableConfig<Customer>;
