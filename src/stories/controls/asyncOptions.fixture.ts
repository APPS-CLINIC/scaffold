import { useEffect, useMemo, useState } from 'react';
import { createSearchMultiSelectFilter } from '@/ui';
import type { FilterOptionSearch, LoadedFilterOptions } from '@/ui';

const advisors = Array.from({ length: 60 }, (_, index) => ({
  value: String(index + 1),
  label: `Example advisor ${String(index + 1).padStart(2, '0')}`,
}));

/** Fixture hook exercising the real search-filter factory: deferred results and sibling pages. */
function useAdvisorOptions(_props: object, search: FilterOptionSearch): LoadedFilterOptions {
  const [pageSize, setPageSize] = useState(10);
  const [received, setReceived] = useState<{ key: string; size: number } | null>(null);
  const key = search.text;
  useEffect(() => {
    setPageSize(10);
  }, [key]);
  useEffect(() => {
    if (!search.load || !key) return;
    const timer = setTimeout(() => setReceived({ key, size: pageSize }), 500);
    return () => clearTimeout(timer);
  }, [key, pageSize, search.load]);
  const matches = useMemo(
    () =>
      key ? advisors.filter((item) => item.label.toLowerCase().includes(key.toLowerCase())) : [],
    [key],
  );
  const visible = received?.key === key ? Math.min(received.size, pageSize) : 0;
  const selected = advisors.filter((option) => search.values.includes(option.value));
  return {
    options: [
      ...new Map(
        [...selected, ...matches.slice(0, visible)].map((item) => [item.value, item]),
      ).values(),
    ],
    loading: Boolean(search.load && key && visible === 0),
    failed: false,
    loadMore:
      visible < matches.length && received?.size === pageSize
        ? () => setPageSize((size) => size + 10)
        : undefined,
    loadingMore: Boolean(visible > 0 && received?.size !== pageSize),
  };
}

export const AsyncAdvisorFilter = createSearchMultiSelectFilter(useAdvisorOptions);
