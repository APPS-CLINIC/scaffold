import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from './facilitiesPreview.service';
import {
  FACILITIES_PREVIEW_DELAY_MS,
  facilitiesPreviewTransport,
} from './facilitiesPreview.transport';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

const query = { q: '', filters: {} };

describe('Facilities asynchronous development transport', () => {
  it('defers evaluation until the response arrives and sends roots without descendants', async () => {
    const read = vi.spyOn(service, 'getFacilityPreviewRoots');
    const response = facilitiesPreviewTransport.roots(query, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(FACILITIES_PREVIEW_DELAY_MS - 1);
    expect(read).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    const roots = await response;
    expect(read).toHaveBeenCalledOnce();
    expect(roots.nodes[0]).toMatchObject({
      parentKey: null,
      hasChildren: true,
      childrenCount: 1,
    });
    expect(roots.nodes.every((node) => !('children' in node))).toBe(true);
  });

  it('returns only the requested sibling page, isolated from the service catalogue', async () => {
    const request = { query, parentKey: 'lending-3' };
    const response = facilitiesPreviewTransport.children(request, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(FACILITIES_PREVIEW_DELAY_MS);
    const children = await response;
    expect(children).toMatchObject({ parentKey: 'lending-3', total: 2, nextCursor: '1' });
    expect(children.nodes).toHaveLength(1);
    expect(children.nodes[0]).toMatchObject({ key: 'lending-4', hasChildren: true });
    expect(children.nodes[0]?.data).not.toBe(
      service.getFacilityPreviewChildren(request).nodes[0]?.data,
    );
    expect(children.nodes[0]).not.toHaveProperty('children');
  });

  it('aborts an in-flight response before reading or returning descendants', async () => {
    const read = vi.spyOn(service, 'getFacilityPreviewChildren');
    const controller = new AbortController();
    const response = facilitiesPreviewTransport.children(
      { query, parentKey: 'lending-1' },
      controller.signal,
    );
    controller.abort();
    await expect(response).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(FACILITIES_PREVIEW_DELAY_MS);
    expect(read).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    await expect(facilitiesPreviewTransport.roots(query, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
