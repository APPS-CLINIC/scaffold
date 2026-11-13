import { getFacilityPreviewChildren, getFacilityPreviewRoots } from './facilitiesPreview.service';
import type { FacilityChildrenRequest, FacilityPreviewQuery } from './facilitiesPreview.service';
import type { FacilityChildrenResponse, FacilityRootsResponse } from '@/features/facilities';

/** Deterministic development latency makes pending rows and cancellation observable. */
export const FACILITIES_PREVIEW_DELAY_MS = 500;

async function respond<T>(read: () => T, signal: AbortSignal, delayMs: number): Promise<T> {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, delayMs);
    signal.addEventListener('abort', abort, { once: true });
  });
  signal.throwIfAborted();
  // Responses own their data, just as deserialized HTTP responses would.
  return structuredClone(read());
}

/** Asynchronous dev transport; only the requested root/sibling page crosses this boundary. */
export interface FacilitiesPreviewTransport {
  roots: (query: FacilityPreviewQuery, signal: AbortSignal) => Promise<FacilityRootsResponse>;
  children: (
    request: FacilityChildrenRequest,
    signal: AbortSignal,
  ) => Promise<FacilityChildrenResponse>;
}

export function createFacilitiesPreviewTransport({
  delayMs = FACILITIES_PREVIEW_DELAY_MS,
  roots = (query, cursor) => getFacilityPreviewRoots(query, cursor),
  children = (request) => getFacilityPreviewChildren(request),
}: {
  delayMs?: number;
  roots?: typeof getFacilityPreviewRoots;
  children?: typeof getFacilityPreviewChildren;
} = {}): FacilitiesPreviewTransport {
  return {
    roots: (query, signal) => respond(() => roots(query), signal, delayMs),
    children: (request, signal) => respond(() => children(request), signal, delayMs),
  };
}

export const facilitiesPreviewTransport = createFacilitiesPreviewTransport();

/** A per-store dependency keeps concurrently rendered stories independent. */
export function getFacilitiesPreviewTransport(extra: unknown): FacilitiesPreviewTransport {
  if (extra && typeof extra === 'object' && 'facilitiesPreviewTransport' in extra) {
    const transport = extra.facilitiesPreviewTransport;
    if (
      transport &&
      typeof transport === 'object' &&
      'roots' in transport &&
      'children' in transport &&
      typeof transport.roots === 'function' &&
      typeof transport.children === 'function'
    ) {
      return transport as FacilitiesPreviewTransport;
    }
  }
  return facilitiesPreviewTransport;
}
