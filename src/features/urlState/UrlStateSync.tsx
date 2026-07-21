import { useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppStore } from '@/app/hooks';
import { parseUrlRouteState } from './urlState.route';
import { parseListQuery } from './urlState.schema';
import { listQueryChanged, routeChanged } from './urlState.slice';

/**
 * Bridges React Router -> Redux. Mounted once in the root layout, it watches
 * the URL (search params + pathname) and mirrors the validated query and the
 * complete route identity into the store.
 *
 * The equality guards avoid dispatching (and thus re-rendering selector
 * subscribers) when the parsed value is unchanged — e.g. on a navigation
 * that only touched the other part of the URL.
 */
export function UrlStateSync() {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const store = useAppStore();

  useEffect(() => {
    const next = parseListQuery(searchParams);
    const current = store.getState().urlState.list;
    if (!shallowEqual(next, current)) {
      dispatch(listQueryChanged(next));
    }
  }, [searchParams, dispatch, store]);

  useEffect(() => {
    const next = parseUrlRouteState(pathname);
    const current = store.getState().urlState.route;
    if (!shallowEqual(next, current)) {
      dispatch(routeChanged(next));
    }
  }, [pathname, dispatch, store]);

  return null;
}
