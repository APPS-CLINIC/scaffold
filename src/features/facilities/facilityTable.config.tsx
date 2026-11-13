import {
  DateCell,
  DateRangeFilter,
  isFilterableField,
  SelectFilter,
  tableFilter,
  TextCell,
} from '@/ui';
import type { GenericDataTableConfig, TableFilterField } from '@/ui';
import type { FacilitiesViewProps } from './FacilitiesView';
import {
  FacilityAmountCell,
  FacilityBasicCell,
  FacilityUtilizationCell,
} from './FacilityTableCells';
import type { FacilityTableRow } from './facilityTable.types';

type Actions = Pick<FacilitiesViewProps, 'getFacilityHref' | 'onOpenRelated' | 'onLoadChildren'>;

/**
 * Column filters live with their fields. View-only controls have no artificial columns.
 * The level cap is not a filter: FacilitiesView shows it as the "Facility level" chips.
 */
export function createFacilityTableConfig({
  getFacilityHref,
  onOpenRelated,
  onLoadChildren,
  facilityTypes,
}: Actions & { facilityTypes: readonly string[] }) {
  const config: GenericDataTableConfig<FacilityTableRow> = {
    id: 'facilities',
    dataKey: 'key',
    fields: [
      {
        field: 'number',
        labelKey: 'facilities.table.basic',
        width: 520,
        headerClassName: '!bg-[var(--table-key-column)]',
        cellClassName: 'bg-[var(--table-key-column)]',
        component: (props) => (
          <FacilityBasicCell
            {...props}
            getFacilityHref={getFacilityHref}
            onOpenRelated={onOpenRelated}
            onLoadChildren={onLoadChildren}
          />
        ),
      },
      {
        field: 'description',
        labelKey: 'facilities.table.description',
        width: 180,
        component: TextCell,
      },
      {
        field: 'expiryDate',
        labelKey: 'facilities.table.expiryDate',
        width: 115,
        component: DateCell,
        filter: tableFilter(DateRangeFilter, {}),
      },
      {
        field: 'looDate',
        labelKey: 'facilities.table.looDate',
        width: 115,
        component: DateCell,
        filter: tableFilter(DateRangeFilter, {}),
      },
      {
        field: 'grantedMinor',
        labelKey: 'facilities.amount.grantedMinor',
        width: 160,
        component: FacilityAmountCell,
        headerClassName: 'text-right',
        cellClassName: 'text-right tabular-nums',
      },
      {
        field: 'utilizedMinor',
        labelKey: 'facilities.amount.utilizedMinor',
        width: 160,
        component: FacilityAmountCell,
        headerClassName: 'text-right',
        cellClassName: 'text-right tabular-nums',
      },
      {
        field: 'availableMinor',
        labelKey: 'facilities.amount.availableMinor',
        width: 160,
        component: FacilityAmountCell,
        headerClassName: 'text-right',
        cellClassName: 'text-right tabular-nums',
      },
      {
        field: 'utilization',
        labelKey: 'facilities.table.utilization',
        // Wide enough for "% wykorzystania" on one line; the percent sign must not wrap alone.
        width: 150,
        component: FacilityUtilizationCell,
        headerClassName: 'whitespace-nowrap text-right',
        cellClassName: 'text-right tabular-nums',
      },
    ],
  };

  // These controls refine the composite basic cell or the view's presentation.
  // They deliberately do not create duplicate columns for values in that cell.
  const viewFilters: TableFilterField[] = [
    {
      field: 'contractCurrency',
      labelKey: 'facilities.filter.contractCurrency',
      filter: tableFilter(SelectFilter, {
        options: ['PLN', 'EUR'].map((value) => ({ value, label: value })),
      }),
    },
    {
      field: 'type',
      filterParam: 'facilityType',
      labelKey: 'facilities.filter.type',
      filter: tableFilter(SelectFilter, {
        options: facilityTypes.map((value) => ({ value, label: value })),
      }),
    },
    {
      field: 'displayCurrency',
      labelKey: 'facilities.filter.displayCurrency',
      filter: tableFilter(SelectFilter, {
        options: [
          { value: 'original', labelKey: 'facilities.currency.original' },
          { value: 'EUR', label: 'EUR' },
          { value: 'PLN', label: 'PLN' },
        ],
      }),
    },
    {
      field: 'commitment',
      labelKey: 'facilities.filter.commitment',
      filter: tableFilter(SelectFilter, {
        options: [
          { value: 'C', labelKey: 'facilities.commitment.committed' },
          { value: 'U', labelKey: 'facilities.commitment.uncommitted' },
        ],
      }),
    },
  ];
  return { config, filterFields: [...viewFilters, ...config.fields.filter(isFilterableField)] };
}
