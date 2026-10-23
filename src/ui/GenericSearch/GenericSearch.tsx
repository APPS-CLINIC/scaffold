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
  /**
   * The text the field mounts with instead of `value`, e.g. a search the user called off. The
   * field keeps it and does not search for it until the user changes the text.
   */
  initialText?: string;
  /** Puts the cursor in the field when it mounts. */
  autoFocus?: boolean;
}

function normalizeSearch(input: string): string {
  const trimmed = input.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : '';
}

/** Search field that reports what to search for once the user stops typing. */
export function GenericSearch({
  value,
  onSearch,
  placeholder,
  className,
  initialText,
  autoFocus = false,
}: GenericSearchProps) {
  const [input, setInput] = useState(initialText ?? value);
  const [shownValue, setShownValue] = useState(value);
  // The text mounted with `initialText`, held back from searching until the user edits it.
  const [held, setHeld] = useState(initialText === undefined ? null : normalizeSearch(initialText));
  const onSearchRef = useRef(onSearch);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    if (autoFocus) wrapperRef.current?.querySelector('input')?.focus();
  }, [autoFocus]);

  // The search can change without the field, e.g. on Back; the field then shows it unless
  // it already searches the same text, or holds a text the user has not edited yet.
  if (value !== shownValue) {
    setShownValue(value);
    if (held === null && normalizeSearch(input) !== normalizeSearch(value)) setInput(value);
  }

  const search = normalizeSearch(input);
  useEffect(() => {
    if (search === normalizeSearch(value) || search === held) return;
    const timer = setTimeout(() => onSearchRef.current(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, value, held]);

  return (
    // The style overrides sit on this wrapper so they reach every element the IWA component
    // renders, whichever one receives `className`.
    <div
      ref={wrapperRef}
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
        onChange={(event) => {
          setInput(typeof event.value === 'string' ? event.value : '');
          setHeld(null);
        }}
      />
    </div>
  );
}
