import { createElement } from 'react';
import { Label } from '@/ui';
import type { DataPanelColumnLabels, DataPanelFieldConfig } from '@/ui';
import type { CustomerSummary } from './customerSummary.types';

export const customerSummaryPanelColumnLabels: DataPanelColumnLabels = {
  first: 'customers.summaryPanel.column.identification',
  second: 'customers.summaryPanel.column.rating',
};

/**
 * Field list for the master-data panel, config-driven per req: no hardcoded
 * JSX field list, so adding/reordering a field never touches the renderer.
 * `cddRiskLevel`/`cddExpirationDate` from the API response are intentionally
 * absent here — they belong to the future CDD/CRS/FATCA section, which will
 * reuse `DataPanel` with its own field config instead.
 */
export const customerSummaryPanelFields: readonly DataPanelFieldConfig<CustomerSummary>[] = [
  { id: 'grid', labelKey: 'customers.summaryPanel.field.grid', column: 1, value: (d) => d.grid },
  { id: 'kkf', labelKey: 'customers.summaryPanel.field.kkf', column: 1, value: (d) => d.kkf },
  {
    id: 'internalGroupName',
    labelKey: 'customers.summaryPanel.field.internalGroupName',
    column: 1,
    value: (d) => d.internalGroupName,
  },
  {
    id: 'corporateGroupName',
    labelKey: 'customers.summaryPanel.field.corporateGroupName',
    column: 1,
    value: (d) => d.corporateGroupName,
  },
  {
    id: 'corporateGroupGrid',
    labelKey: 'customers.summaryPanel.field.corporateGroupGrid',
    column: 1,
    value: (d) => d.corporateGroupGrid,
  },
  {
    id: 'pamName',
    labelKey: 'customers.summaryPanel.field.pamName',
    column: 1,
    value: (d) => d.pamName,
  },
  {
    id: 'pamLam',
    labelKey: 'customers.summaryPanel.field.pamLam',
    column: 1,
    value: (d) => d.pamLam,
  },
  {
    id: 'homeCountry',
    labelKey: 'customers.summaryPanel.field.homeCountry',
    column: 1,
    value: (d) => d.homeCountry,
  },
  {
    id: 'segmentColor',
    labelKey: 'customers.summaryPanel.field.segmentColor',
    column: 1,
    value: (d) => d.segmentColor,
  },
  {
    id: 'rating',
    labelKey: 'customers.summaryPanel.field.rating',
    column: 2,
    value: (d) => d.rating,
    valueSize: 'label',
    renderValue: ({ value }) =>
      createElement(Label, { text: String(value), variant: 'Sky', size: 'small' }),
  },
  {
    id: 'lendingRatingDate',
    labelKey: 'customers.summaryPanel.field.lendingRatingDate',
    column: 2,
    value: (d) => d.lendingRatingDate,
  },
];
