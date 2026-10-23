import { useEffect, useRef, useState } from 'react';

export type LoadingPhase = 'idle' | 'loading' | 'slow';

const SHOW_AFTER_MS = 300;
const MIN_VISIBLE_MS = 500;
const SLOW_AFTER_MS = 10_000;

/**
 * What a load shows. Nothing for the first 300 ms, so a quick answer swaps the data without a
 * flash; then `loading` for at least 500 ms, so it never flashes either; and `slow` once the
 * same request has taken 10 s. A new `request` while loading starts the 10 s again.
 */
export function useLoadingPhase(loading: boolean, request: string): LoadingPhase {
  const [phase, setPhase] = useState<LoadingPhase>('idle');
  const [countedRequest, setCountedRequest] = useState(request);
  const shownAtRef = useRef<number | null>(null);

  if (request !== countedRequest) {
    setCountedRequest(request);
    if (phase === 'slow') setPhase('loading');
  }

  useEffect(() => {
    if (loading) {
      const timers: ReturnType<typeof setTimeout>[] = [];
      if (shownAtRef.current === null) {
        timers.push(
          setTimeout(() => {
            shownAtRef.current = Date.now();
            setPhase('loading');
          }, SHOW_AFTER_MS),
        );
      }
      timers.push(setTimeout(() => setPhase('slow'), SLOW_AFTER_MS));
      return () => timers.forEach(clearTimeout);
    }

    const shownAt = shownAtRef.current;
    if (shownAt === null) return undefined;
    const timer = setTimeout(
      () => {
        shownAtRef.current = null;
        setPhase('idle');
      },
      Math.max(0, shownAt + MIN_VISIBLE_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [loading, countedRequest]);

  return phase;
}
