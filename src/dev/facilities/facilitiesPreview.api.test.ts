import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { facilitiesPreviewApi } from './facilitiesPreview.api';

const query = { q: '', filters: {} };
describe('Facilities preview RTK Query cache', () => {
  it('loads one branch into the cache without changing the downloadable transport response', async () => {
    const store = makeStore();
    const root = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.initiate(query),
    );
    const initial = await root.unwrap();
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
    await root.unwrap();
    const failed = store.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewChildren.initiate({
        query,
        parentKey: 'lending-1',
        cursor: '-1',
      }),
    );
    await expect(failed.unwrap()).rejects.toMatchObject({ status: 'CUSTOM_ERROR' });
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
    await retry.unwrap();
    expect(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(store.getState()).data
        ?.snapshot.nodes[0]?.childrenState,
    ).toBe('loaded');
    failed.unsubscribe();
    retry.unsubscribe();
    root.unsubscribe();
    store.dispatch(facilitiesPreviewApi.util.resetApiState());
  });
});
