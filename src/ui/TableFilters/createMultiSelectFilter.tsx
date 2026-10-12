import { MultiSelectFilter, type MultiSelectFilterProps } from './MultiSelectFilter';
import type {
  TableFilterComponent,
  TableFilterOption,
  TableFilterProps,
  TableFilterValues,
} from './TableFilters.types';

/**
 * A multiselect filter whose options come from a hook, such as a list the service serves.
 * The hook gets the props the field declares, and runs both in the control and in its chip,
 * so they show the same labels. Create it once, where the hook is defined.
 */
export function createMultiSelectFilter<P extends object>(
  useOptions: (props: P) => readonly TableFilterOption[],
  { selectionLimit }: Pick<MultiSelectFilterProps, 'selectionLimit'> = {},
): TableFilterComponent<P> {
  function LoadedOptionsMultiSelectFilter(props: TableFilterProps & P) {
    const { inputId, labelId, param, values, onChange } = props;
    return (
      <MultiSelectFilter
        inputId={inputId}
        labelId={labelId}
        param={param}
        values={values}
        onChange={onChange}
        options={useOptions(props)}
        selectionLimit={selectionLimit}
      />
    );
  }

  LoadedOptionsMultiSelectFilter.useSummary = function useLoadedOptionsSummary(
    values: TableFilterValues,
    props: P & { param: string },
  ): string {
    return MultiSelectFilter.useSummary(values, { param: props.param, options: useOptions(props) });
  };

  return LoadedOptionsMultiSelectFilter;
}
