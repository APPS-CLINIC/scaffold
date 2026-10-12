import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MultiSelectFilter, type MultiSelectFilterProps } from './MultiSelectFilter';
import type {
  FilterOptionSearch,
  LoadedFilterOptions,
  TableFilterComponent,
  TableFilterProps,
  TableFilterValues,
} from './TableFilters.types';

const SEARCH_DELAY_MS = 300;
const MIN_SEARCH_LENGTH = 3;
const NO_VALUES: readonly string[] = [];

function normalizeSearch(input: string): string {
  const trimmed = input.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : '';
}

/**
 * A multiselect for a list too long to load whole: it searches its options elsewhere, such as
 * on the service. The hook gets the props the field declares and the search — the text typed
 * into the open list once typing pauses, and the picked values, which the hook names too. The
 * chip runs the same hook without a text. Create it once, where the hook is defined.
 */
export function createSearchMultiSelectFilter<P extends object>(
  useSearchOptions: (props: P, search: FilterOptionSearch) => LoadedFilterOptions,
  { selectionLimit }: Pick<MultiSelectFilterProps, 'selectionLimit'> = {},
): TableFilterComponent<P> {
  function SearchMultiSelectFilter(props: TableFilterProps & P) {
    const { t } = useTranslation();
    const { inputId, labelId, param, values, onChange } = props;
    const [typed, setTyped] = useState('');
    const [text, setText] = useState('');
    const search = normalizeSearch(typed);
    const minLengthHint = t('table.filters.searchMinLength', { count: MIN_SEARCH_LENGTH });

    useEffect(() => {
      const timer = setTimeout(() => setText(search), SEARCH_DELAY_MS);
      return () => clearTimeout(timer);
    }, [search]);

    const { options, loading, failed } = useSearchOptions(props, {
      text,
      values: values[param] ?? NO_VALUES,
    });

    return (
      <MultiSelectFilter
        inputId={inputId}
        labelId={labelId}
        param={param}
        values={values}
        onChange={onChange}
        options={options}
        // The search counts as on its way while typing pauses, too.
        loading={loading || search !== text}
        failed={failed}
        selectionLimit={selectionLimit}
        onSearch={setTyped}
        searchPlaceholder={minLengthHint}
        searchMessage={typed.trim() && !search ? minLengthHint : undefined}
      />
    );
  }

  SearchMultiSelectFilter.useSummary = function useSearchSummary(
    values: TableFilterValues,
    props: P & { param: string },
  ): string {
    return MultiSelectFilter.useSummary(values, {
      param: props.param,
      ...useSearchOptions(props, { text: '', values: values[props.param] ?? NO_VALUES }),
    });
  };

  return SearchMultiSelectFilter;
}
