import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { facilitiesPreviewApi } from './facilitiesPreview.api';

import { FACILITIES_PREVIEW_DELAY_MS } from './facilitiesPreview.transport';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

async function settle<T>(request: { unwrap: () => Promise<T> }) {
  await vi.advanceTimersByTimeAsync(FACILITIES_PREVIEW_DELAY_MS);
  return request.unwrap();
}

const query = { q: '', filters: {} };
describe('Facilities preview RTK Query cache', () => {
  it('loads one branch into the cache without changing the downloadable transport response', async () => {
    const store = makeStore();
    const root = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.initiate(query),
    );
    const pending = facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(
      store.getState(),
    );
    expect(pending.isLoading).toBe(true);
    expect(pending.data).toBeUndefined();
    const initial = await settle(root);
    expect(initial.snapshot.nodes[0]).toMatchObject({
      hasChildren: true,
      childrenState: 'unloaded',
      children: [],
    });
    const transport = JSON.stringify(initial.response);
    const child = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewChildren.initiate({
        query,
        parentKey: 'lending-1',
      }),
    );
    const readRoot = () =>
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(store.getState()).data;
    expect(readRoot()?.snapshot.nodes[0]).toMatchObject({
      childrenState: 'loading',
      children: [],
      hasChildren: true,
    });
    await vi.advanceTimersByTimeAsync(FACILITIES_PREVIEW_DELAY_MS - 1);
    expect(readRoot()?.snapshot.nodes[0]?.children).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    await child.unwrap();
    const loaded = facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(
      store.getState(),
    ).data;
    expect(loaded?.snapshot.nodes[0]).toMatchObject({ childrenState: 'loaded' });
    expect(loaded?.snapshot.nodes[0]?.children[0]?.key).toBe('lending-2');
    expect(JSON.stringify(loaded?.response)).toBe(transport);
    child.unsubscribe();
    root.unsubscribe();
    store.dispatch(facilitiesPreviewApi.util.resetApiState());
  });
  it('exposes a branch failure and allows a valid retry', async () => {
    const store = makeStore();
    const root = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.initiate(query),
    );
    await settle(root);
    const failed = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewChildren.initiate({
        query,
        parentKey: 'lending-1',
        cursor: '-1',
      }),
    );
    await expect(settle(failed)).rejects.toMatchObject({ status: 'CUSTOM_ERROR' });
    expect(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(store.getState()).data
        ?.snapshot.nodes[0]?.childrenState,
    ).toBe('error');
    const retry = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewChildren.initiate({
        query,
        parentKey: 'lending-1',
      }),
    );
    await settle(retry);
    expect(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(store.getState()).data
        ?.snapshot.nodes[0]?.childrenState,
    ).toBe('loaded');
    failed.unsubscribe();
    retry.unsubscribe();
    root.unsubscribe();
    store.dispatch(facilitiesPreviewApi.util.resetApiState());
  });

  it('restores an unloaded branch after cancellation and allows a new request', async () => {
    const store = makeStore();
    const root = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.initiate(query),
    );
    await settle(root);
    const arg = { query, parentKey: 'lending-1' };
    const child = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewChildren.initiate(arg),
    );
    const response = child.unwrap();
    child.abort();
    await expect(response).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(FACILITIES_PREVIEW_DELAY_MS);
    const readRoot = () =>
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(store.getState()).data;
    expect(readRoot()?.snapshot.nodes[0]).toMatchObject({
      childrenState: 'unloaded',
      children: [],
    });
    const retry = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewChildren.initiate(arg),
    );
    await settle(retry);
    expect(readRoot()?.snapshot.nodes[0]?.children[0]?.key).toBe('lending-2');
    child.unsubscribe();
    retry.unsubscribe();
    root.unsubscribe();
    store.dispatch(facilitiesPreviewApi.util.resetApiState());
  });
});
