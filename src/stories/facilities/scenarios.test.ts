import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { facilitiesPreviewApi } from '@/dev/facilities/facilitiesPreview.api';
import {
  getFacilityPreviewChildren,
  getFacilityPreviewRoots,
} from '@/dev/facilities/facilitiesPreview.service';
import { createFacilitiesScenario, createLargeFacilitiesSource } from './scenarios';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
const query = { q: '', filters: {} };

describe('Facilities story scenarios', () => {
  it('bounds both root and child responses in a large catalogue', () => {
    const source = createLargeFacilitiesSource();
    const roots = getFacilityPreviewRoots(query, undefined, source);
    expect(roots).toMatchObject({ total: 80, nextCursor: '25' });
    expect(roots.nodes).toHaveLength(25);
    expect(roots.nodes[0]).toMatchObject({
      key: 'wide-root',
      hasChildren: true,
      childrenCount: 1000,
    });
    expect(roots.nodes[0]).not.toHaveProperty('children');
    const children = getFacilityPreviewChildren({ query, parentKey: 'wide-root' }, source);
    expect(children).toMatchObject({ total: 1000, nextCursor: '25' });
    expect(children.nodes).toHaveLength(25);
    const next = getFacilityPreviewChildren(
      { query, parentKey: 'wide-root', cursor: '25' },
      source,
    );
    expect(next.nodes[0]?.data.number).toBe('F-CHILD-0026');
    expect(next.nodes[0]).toMatchObject({ hasChildren: false, childrenCount: 0 });
  });

  it('isolates failure and retry budgets in concurrently mounted stores', async () => {
    const makeExampleStore = (scenario: 'root-error' | 'default') =>
      makeStore(undefined, {
        listenToBrowserEvents: false,
        extraArgument: { facilitiesPreviewTransport: createFacilitiesScenario(scenario) },
      });
    const failing = makeExampleStore('root-error');
    const healthy = makeExampleStore('default');
    const failed = failing.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.initiate(query),
    );
    const success = healthy.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.initiate(query),
    );
    await vi.advanceTimersByTimeAsync(500);
    expect(await failed).toMatchObject({ isError: true });
    expect((await success).data?.response.nodes).toHaveLength(6);
    const retry = failing.dispatch(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.initiate(query, {
        forceRefetch: true,
      }),
    );
    await vi.advanceTimersByTimeAsync(500);
    expect((await retry).data?.response.nodes).toHaveLength(6);
    expect(
      facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(healthy.getState())
        .requestId,
    ).toBe(success.requestId);
    failed.unsubscribe();
    success.unsubscribe();
    retry.unsubscribe();
    failing.dispatch(facilitiesPreviewApi.util.resetApiState());
    healthy.dispatch(facilitiesPreviewApi.util.resetApiState());
  });
});
