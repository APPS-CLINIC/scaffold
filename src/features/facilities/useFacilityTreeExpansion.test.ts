import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { facilityPreviewSnapshot } from '@/dev/facilities/facilities.fixture';
import type { FacilityLevel } from './facilities.types';
import { useFacilityTreeExpansion } from './useFacilityTreeExpansion';
import type { FacilityTreeExpansionOptions } from './useFacilityTreeExpansion';

const nodes = facilityPreviewSnapshot.nodes;

function renderExpansion(onExpandToLevel?: FacilityTreeExpansionOptions['onExpandToLevel']) {
  return renderHook(
    (props: { queryKey: string }) =>
      useFacilityTreeExpansion({
        queryKey: props.queryKey,
        nodes,
        autoExpandedKeys: [],
        onExpandToLevel,
      }),
    { initialProps: { queryKey: 'first' } },
  );
}

describe('useFacilityTreeExpansion', () => {
  it('opens loaded branches above a level without an owner loader', () => {
    const { result } = renderExpansion();
    act(() => {
      void result.current.openToLevel(2);
    });
    expect(result.current.selectedLevel).toBe(2);
    expect(result.current.expandedKeys).toEqual(
      nodes.filter((node) => node.hasChildren && node.businessLevel < 2).map((node) => node.key),
    );
  });

  it('returns to the previous level when loading a level fails', async () => {
    const onExpandToLevel = vi
      .fn<(level: FacilityLevel, signal: AbortSignal) => Promise<readonly string[]>>()
      .mockResolvedValueOnce(['lending-1'])
      .mockRejectedValueOnce(new Error('page failed'));
    const { result } = renderExpansion(onExpandToLevel);

    await act(() => result.current.openToLevel(2));
    expect(result.current.selectedLevel).toBe(2);
    await act(() => result.current.openToLevel(4));

    expect(result.current.selectedLevel).toBe(2);
    expect(result.current.expandingTo).toBeNull();
    expect(result.current.expandedKeys).toEqual(['lending-1']);
  });

  it('aborts the load in flight and starts from the top level for a new query', () => {
    let signal: AbortSignal | undefined;
    const { result, rerender } = renderExpansion((_level, abort) => {
      signal = abort;
      return new Promise(() => undefined);
    });
    act(() => {
      void result.current.openToLevel(3);
    });
    expect(result.current.expandingTo).toBe(3);

    rerender({ queryKey: 'second' });

    expect(signal?.aborted).toBe(true);
    expect(result.current.expandingTo).toBeNull();
    expect(result.current.selectedLevel).toBe(1);
  });
});
