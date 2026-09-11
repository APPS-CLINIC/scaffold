import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GenericDataTableDataKey } from './GenericDataTable.types';
import { useExpandedRows } from './useExpandedRows';

interface Row {
  id: number;
}

interface HookProps {
  dataKey: GenericDataTableDataKey<Row>;
  expandedRowKeys: readonly string[];
  singleRowExpansion: boolean;
  onExpandedRowKeysChange: (keys: readonly string[]) => void;
}

function renderControlled(initialProps: Omit<HookProps, 'dataKey'>) {
  return renderHook((props: HookProps) => useExpandedRows<Row>(props), {
    initialProps: { dataKey: 'id', ...initialProps },
  });
}

describe('useExpandedRows (controlled)', () => {
  it('adds to the latest keys when called through a toggle from an earlier render', () => {
    const onExpandedRowKeysChange = vi.fn();
    const props = { expandedRowKeys: [], singleRowExpansion: false, onExpandedRowKeysChange };
    const { result, rerender } = renderControlled(props);
    const toggleFromFirstRender = result.current.toggleRow;

    rerender({ dataKey: 'id', ...props, expandedRowKeys: ['1'] });
    act(() => toggleFromFirstRender({ id: 2 }));

    expect(onExpandedRowKeysChange).toHaveBeenLastCalledWith(['1', '2']);
  });

  it('collapses from the latest keys when called through a toggle from an earlier render', () => {
    const onExpandedRowKeysChange = vi.fn();
    const props = { expandedRowKeys: [], singleRowExpansion: false, onExpandedRowKeysChange };
    const { result, rerender } = renderControlled(props);
    const toggleFromFirstRender = result.current.toggleRow;

    rerender({ dataKey: 'id', ...props, expandedRowKeys: ['1', '2'] });
    act(() => toggleFromFirstRender({ id: 1 }));

    expect(onExpandedRowKeysChange).toHaveBeenLastCalledWith(['2']);
  });

  it('keeps a single expanded row when single-row expansion is on', () => {
    const onExpandedRowKeysChange = vi.fn();
    const props = { expandedRowKeys: ['1'], singleRowExpansion: true, onExpandedRowKeysChange };
    const { result } = renderControlled(props);

    act(() => result.current.toggleRow({ id: 2 }));

    expect(onExpandedRowKeysChange).toHaveBeenLastCalledWith(['2']);
  });
});
