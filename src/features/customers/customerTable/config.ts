import type { Customer } from '@/features/customers/customers.types';
import {
  ActiveInactiveStatusCell,
  DateCell,
  TextCell,
  UnderlinedTextCell,
  ValidityStatusCell,
} from '@/ui';
import type { GenericDataTableConfig } from '@/ui';

export const customerTableConfig = {
  dataKey: 'id',
  singleRowExpansion: true,
  columns: [
    {
      field: 'customerFullName',
      headerKey: 'customers.table.column.name',
      component: UnderlinedTextCell,
      sortable: true,
      headerClassName: 'w-48 min-w-48 max-w-48',
      cellClassName: 'w-48 min-w-48 max-w-48 whitespace-normal',
    },
    {
      field: 'grid',
      headerKey: 'customers.table.column.grid',
      component: TextCell,
      sortable: true,
      headerClassName: 'w-24 min-w-24 max-w-24',
    },
    {
      field: 'customerStatus',
      headerKey: 'customers.table.column.status',
      component: ActiveInactiveStatusCell,
      sortable: true,
      headerClassName: 'w-28 min-w-28 max-w-28',
    },
    {
      field: 'corporateGroupName',
      headerKey: 'customers.table.column.group',
      component: UnderlinedTextCell,
      sortable: true,
      headerClassName: 'w-40 min-w-40 max-w-40',
      cellClassName: 'w-40 min-w-40 max-w-40 whitespace-normal',
    },
    {
      field: 'customerSector',
      headerKey: 'customers.table.column.sector',
      component: TextCell,
      sortable: true,
      headerClassName: 'w-32 min-w-32 max-w-32',
    },
    {
      field: 'dateReview',
      headerKey: 'customers.table.column.reviewDate',
      component: DateCell,
      sortable: true,
      headerClassName: 'w-36 min-w-36 max-w-36',
    },
    {
      field: 'ratingDt',
      headerKey: 'customers.table.column.ratingDate',
      component: DateCell,
      sortable: true,
      headerClassName: 'w-36 min-w-36 max-w-36',
    },
    {
      field: 'tsPriceConditionStatus',
      headerKey: 'customers.table.column.priceConditionStatus',
      component: ValidityStatusCell,
      sortable: true,
      headerClassName: 'w-44 min-w-44 max-w-44',
    },
    {
      field: 'tsPriceConditionEndDt',
      headerKey: 'customers.table.column.priceConditionEndDate',
      component: DateCell,
      sortable: true,
      headerClassName: 'w-40 min-w-40 max-w-40',
    },
  ],
  detailFields: [
    { field: 'kkf', labelKey: 'customers.table.detail.kkf' },
    { field: 'krs', labelKey: 'customers.table.detail.krs' },
    { field: 'taxID', labelKey: 'customers.table.detail.taxId' },
    { field: 'regon', labelKey: 'customers.table.detail.regon' },
    { field: 'customerShortName', labelKey: 'customers.table.detail.shortName' },
    { field: 'rmAdvisor', labelKey: 'customers.table.detail.rmAdvisor' },
    { field: 'corporateGroupGRID', labelKey: 'customers.table.detail.corporateGroupGrid' },
    { field: 'internalGroupName', labelKey: 'customers.table.detail.internalGroupName' },
  ],
} satisfies GenericDataTableConfig<Customer>;
