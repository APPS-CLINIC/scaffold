import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  allFacilityNodes,
  facilityChildrenComplete,
  facilityQueryKey,
} from '@/features/facilities';
import type { FacilityLevel } from '@/features/facilities';
import { useLoadingPhase } from '@/ui';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import {
  facilitiesPreviewApi,
  useGetFacilityPreviewRootsQuery,
  useLazyGetFacilityPreviewChildrenQuery,
} from './facilitiesPreview.api';
import type { FacilityChildrenRequest, FacilityPreviewQuery } from './facilitiesPreview.service';

/**
 * Data side of the Facilities preview: the root request for the URL query, paged roots and
 * children, the matches revealed after a search and the pages a facility level needs.
 */
export function useFacilitiesPreview() {
  const dispatch = useAppDispatch();
  const listQuery = useAppSelector(selectListQuery);
  const requestKey = facilityQueryKey(listQuery.q, listQuery.filters);
  // A currency-only URL change keeps the same service request and cached branches.
  const query = useMemo(() => JSON.parse(requestKey) as FacilityPreviewQuery, [requestKey]);
  const {
    currentData: data,
    data: previousData,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useGetFacilityPreviewRootsQuery(query);
  const loadingPhase = useLoadingPhase(isFetching, requestKey);
  const [toolbarReady, setToolbarReady] = useState(false);
  if (!toolbarReady && (data !== undefined || isError)) setToolbarReady(true);
  const [fetchChildren] = useLazyGetFacilityPreviewChildrenQuery();

  const loadPage = useCallback(
    async (request: FacilityChildrenRequest, signal?: AbortSignal) => {
      signal?.throwIfAborted();
      const pending = fetchChildren(request);
      const abort = () => pending.abort();
      signal?.addEventListener('abort', abort, { once: true });
      try {
        return await pending.unwrap();
      } finally {
        signal?.removeEventListener('abort', abort);
      }
    },
    [fetchChildren],
  );
  // The cache is read at call time: loops below must see pages merged by earlier awaits.
  const readData = useCallback(
    () =>
      dispatch(
        (_dispatch, getState) =>
          facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(getState()).data,
      ),
    [dispatch, query],
  );
  const findNode = useCallback(
    (key: string) =>
      allFacilityNodes(readData()?.snapshot.nodes ?? []).find((node) => node.key === key),
    [readData],
  );

  const loadChildren = useCallback(
    async (key: string, signal?: AbortSignal) => {
      const node = findNode(key);
      if (!node?.hasChildren || facilityChildrenComplete(node)) return;
      return loadPage({ query, parentKey: key, cursor: node.nextCursor ?? undefined }, signal);
    },
    [findNode, query, loadPage],
  );
  const loadMoreRoots = useCallback(
    async (signal?: AbortSignal) => {
      const cursor = readData()?.nextRootCursor;
      if (cursor) return loadPage({ query, parentKey: null, cursor }, signal);
    },
    [readData, loadPage, query],
  );

  const response = data?.response;
  useEffect(() => {
    let active = true;
    const revealMatches = async () => {
      for (const key of [...(response?.view.autoExpandedKeys ?? [])].reverse()) {
        if (!active) return;
        await loadChildren(key);
      }
    };
    void revealMatches().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [response, loadChildren]);

  // Opens every branch above `level`, fetching the root and child pages it needs on the way.
  const expandToLevel = useCallback(
    async (level: FacilityLevel, signal: AbortSignal) => {
      while (readData()?.nextRootCursor) {
        signal.throwIfAborted();
        await loadMoreRoots(signal);
      }
      const queue = [...(readData()?.snapshot.nodes ?? [])];
      const keys: string[] = [];
      for (let index = 0; index < queue.length; index++) {
        signal.throwIfAborted();
        const pending = queue[index];
        if (!pending?.hasChildren || pending.businessLevel >= level) continue;
        keys.push(pending.key);
        let current = findNode(pending.key);
        while (current && !facilityChildrenComplete(current)) {
          signal.throwIfAborted();
          await loadChildren(current.key, signal);
          current = findNode(pending.key);
        }
        queue.push(...(current?.children ?? []));
      }
      return keys;
    },
    [findNode, loadChildren, loadMoreRoots, readData],
  );

  return {
    data,
    previousData,
    isError,
    refetch,
    tableLoading: isLoading || loadingPhase !== 'idle',
    toolbarReady,
    loadChildren,
    loadMoreRoots,
    expandToLevel,
  };
}
