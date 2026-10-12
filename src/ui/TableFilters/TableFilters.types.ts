import type { ComponentType, ReactElement } from 'react';
import type { MessageKey } from '@/i18n/messages/pl';

/** Filter values by param; an absent or empty list means no value. */
export type TableFilterValues = Readonly<Record<string, readonly string[]>>;

/** Props the filter dialog gives every filter control. */
export interface TableFilterProps {
  /** Id of the control's first input; focus starts there when the dialog opens. */
  inputId: string;
  /** Id of the row label; the control takes its accessible name from it. */
  labelId: string;
  /** The param the field filters by; a control may also own `param.<part>` params. */
  param: string;
  /** Values of the params the filter owns. */
  values: TableFilterValues;
  /** The next values of the params the filter owns; an empty list clears a param. */
  onChange: (values: TableFilterValues) => void;
}

/**
 * A filter control that can also put its values into words for the applied-filter chip.
 * The summary is a hook, so it can read translations or loaded options like the control does.
 */
export type TableFilterComponent<P extends object> = ComponentType<TableFilterProps & P> & {
  useSummary: (values: TableFilterValues, props: P & { param: string }) => string;
};

/** Props of the chip that shows one applied filter. */
export interface TableFilterChipProps {
  /** The translated field label. */
  label: string;
  param: string;
  /** Values of the params the filter owns. */
  values: TableFilterValues;
  onRemove: () => void;
}

/** A filter control with its configured props, as a table field config holds it. */
export interface TableFilterDeclaration {
  render: (props: TableFilterProps) => ReactElement;
  renderChip: (props: TableFilterChipProps) => ReactElement;
}

/** What the filter UI needs to know about a table field. */
export interface TableFilterField {
  field: string;
  labelKey: MessageKey;
  /** The param the field filters by when it differs from `field`. */
  filterParam?: string;
  filter?: TableFilterDeclaration;
}

export type FilterableTableField = TableFilterField & { filter: TableFilterDeclaration };

/** A multiselect option: a translated `labelKey`, or a `label` shown as it is. */
export type TableFilterOption =
  { value: string; labelKey: MessageKey } | { value: string; label: string };

export interface TableFiltersProps {
  /** The fields the table uses, in display order; fields without a `filter` are skipped. */
  fields: readonly TableFilterField[];
  /** Current filter values; params of other fields are ignored. */
  values: TableFilterValues;
  /** The next values of the filters shown; a filter left out has no value. */
  onChange: (values: TableFilterValues) => void;
}
