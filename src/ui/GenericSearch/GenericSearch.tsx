import { useEffect, useRef, useState } from 'react';
import { SearchWithAutocomplete, twMerge } from '@/ui';

const SEARCH_DELAY_MS = 300;
const MIN_SEARCH_LENGTH = 3;

export interface GenericSearchProps {
  /** The search applied now, e.g. the list URL's `q`. */
  value: string;
  /**
   * Called a moment after typing pauses with the trimmed text, or with `''` while it is
   * shorter than three characters.
   */
  onSearch: (search: string) => void;
  placeholder: string;
  className?: string;
}

/** The text searched for: trimmed, and empty until it is long enough. */
function searchText(input: string): string {
  const trimmed = input.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : '';
}

/** Search field that reports what to search for once the user stops typing. */
export function GenericSearch({ value, onSearch, placeholder, className }: GenericSearchProps) {
  const [input, setInput] = useState(value);
  const [shownValue, setShownValue] = useState(value);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  // The search can change without the field, e.g. on Back; the field then shows it unless
  // it already searches the same text.
  if (value !== shownValue) {
    setShownValue(value);
    if (searchText(input) !== searchText(value)) setInput(value);
  }

  const search = searchText(input);
  useEffect(() => {
    if (search === searchText(value)) return;
    const timer = setTimeout(() => onSearchRef.current(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, value]);

  return (
    // The overrides sit on this wrapper so they reach every element of the IWA field,
    // whichever one receives `className`.
    <div
      className={twMerge(
        'w-full max-w-96 [&_*]:!bg-white [&_input]:!border-[var(--border)] [&_input:focus]:!border-[var(--navigation-accent)] [&_input:focus]:![box-shadow:none] [&_input:focus]:!outline-none',
        className,
      )}
    >
      <SearchWithAutocomplete
        className="w-full"
        placeholder={placeholder}
        value={input}
        // The clear action hands back `valueReturnedOnClear`, which is not text.
        onChange={(event) => setInput(typeof event.value === 'string' ? event.value : '')}
      />
    </div>
  );
}
