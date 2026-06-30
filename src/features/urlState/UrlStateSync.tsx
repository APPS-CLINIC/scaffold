import { useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppStore } from '@/app/hooks';
import { parseListQuery } from './urlState.schema';
import { listQueryChanged } from './urlState.slice';

/**
 * Bridges React Router -> Redux. Mounted once in the root layout, it watches
 * the URL search params and mirrors the validated query into the store.
 *
 * The shallow-equality guard avoids dispatching (and thus re-rendering
 * selector subscribers) when the parsed query is unchanged — e.g. on a
 * navigation that only touched the pathname.
 */
export function UrlStateSync() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const store = useAppStore();

  useEffect(() => {
    const next = parseListQuery(searchParams);
    const current = store.getState().urlState.list;
    if (!shallowEqual(next, current)) {
      dispatch(listQueryChanged(next));
    }
  }, [searchParams, dispatch, store]);

  return null;
}
