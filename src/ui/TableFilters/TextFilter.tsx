import { TextInput } from '@/ui';
import type { TableFilterProps, TableFilterValues } from './TableFilters.types';

/** The longest text a URL filter value may hold. */
const MAX_TEXT_LENGTH = 200;

/** Free text the field has to contain; blank text is no filter. */
export function TextFilter({ inputId, param, values, onChange }: TableFilterProps) {
  return (
    <TextInput
      id={inputId}
      value={values[param]?.[0] ?? ''}
      maxLength={MAX_TEXT_LENGTH}
      onChange={(event) => {
        const text = event.target.value;
        onChange({ [param]: text.trim() ? [text] : [] });
      }}
      className="w-full"
      inputClassName="w-full"
    />
  );
}

TextFilter.useSummary = function useTextSummary(
  values: TableFilterValues,
  { param }: { param: string },
): string {
  return values[param]?.[0]?.trim() ?? '';
};
