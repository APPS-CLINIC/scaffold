import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingPhase } from './useLoadingPhase';

function renderPhase(loading: boolean, request = 'page=1') {
  return renderHook(({ loading: isLoading, request: key }) => useLoadingPhase(isLoading, key), {
    initialProps: { loading, request },
  });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLoadingPhase', () => {
  it('shows nothing when the answer comes within 300 ms', () => {
    const { result, rerender } = renderPhase(true);

    advance(299);
    expect(result.current).toBe('idle');

    rerender({ loading: false, request: 'page=1' });
    advance(1000);
    expect(result.current).toBe('idle');
  });

  it('shows the loading state after 300 ms and keeps it for at least 500 ms', () => {
    const { result, rerender } = renderPhase(true);

    advance(300);
    expect(result.current).toBe('loading');

    advance(100);
    rerender({ loading: false, request: 'page=1' });
    advance(399);
    expect(result.current).toBe('loading');

    advance(1);
    expect(result.current).toBe('idle');
  });

  it('goes back to idle at once when the loading state has been on long enough', () => {
    const { result, rerender } = renderPhase(true);
    advance(2000);

    rerender({ loading: false, request: 'page=1' });
    advance(0);

    expect(result.current).toBe('idle');
  });

  it('turns slow once the same request has taken 10 s', () => {
    const { result } = renderPhase(true);

    advance(9999);
    expect(result.current).toBe('loading');

    advance(1);
    expect(result.current).toBe('slow');
  });

  it('counts the 10 s again for a new request', () => {
    const { result, rerender } = renderPhase(true);
    advance(10_000);
    expect(result.current).toBe('slow');

    rerender({ loading: true, request: 'page=2' });
    expect(result.current).toBe('loading');

    advance(9999);
    expect(result.current).toBe('loading');
    advance(1);
    expect(result.current).toBe('slow');
  });
});
