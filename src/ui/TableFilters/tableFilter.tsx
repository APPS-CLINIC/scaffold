import { ChipInput } from '@/ui';
import type {
  TableFilterChipProps,
  TableFilterComponent,
  TableFilterDeclaration,
  TableFilterProps,
} from './TableFilters.types';

/**
 * Declare which control filters a table field, with that control's own props:
 * `filter: tableFilter(MultiSelectFilter, { options })`. Call it once per field, where the
 * config is defined: each call creates the component of the field's chip.
 */
export function tableFilter<P extends object>(
  Component: TableFilterComponent<P>,
  props: P,
): TableFilterDeclaration {
  function AppliedFilterChip({ label, param, values, onRemove }: TableFilterChipProps) {
    const summary = Component.useSummary(values, { ...props, param });
    return (
      <ChipInput
        chips={[{ label: `${label}: ${summary}`, value: param }]}
        onChange={(chips) => {
          if (chips.length === 0) onRemove();
        }}
      />
    );
  }

  return {
    render: (filterProps: TableFilterProps) => <Component {...props} {...filterProps} />,
    renderChip: (chipProps: TableFilterChipProps) => <AppliedFilterChip {...chipProps} />,
  };
}
