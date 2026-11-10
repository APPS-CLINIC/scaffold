import { getFacilityPreviewChildren, getFacilityPreviewRoots } from './facilitiesPreview.service';
import type { FacilityChildrenRequest, FacilityPreviewQuery } from './facilitiesPreview.service';

/** Deterministic development latency makes pending rows and cancellation observable. */
export const FACILITIES_PREVIEW_DELAY_MS = 500;

async function respond<T>(read: () => T, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, FACILITIES_PREVIEW_DELAY_MS);
    signal.addEventListener('abort', abort, { once: true });
  });
  signal.throwIfAborted();
  // Responses own their data, just as deserialized HTTP responses would.
  return structuredClone(read());
}

/** Asynchronous dev transport; only the requested root/sibling page crosses this boundary. */
export const facilitiesPreviewTransport = {
  roots: (query: FacilityPreviewQuery, signal: AbortSignal) =>
    respond(() => getFacilityPreviewRoots(query), signal),
  children: (request: FacilityChildrenRequest, signal: AbortSignal) =>
    respond(() => getFacilityPreviewChildren(request), signal),
};
