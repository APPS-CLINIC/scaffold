import { startAppListening } from '@/app/listenerMiddleware';
import { itemsQueryChanged } from '@/features/urlState/urlState.slice';
import { itemsApi } from './items.api';

/**
 * Reactive prefetch: whenever the items query changes (i.e. the URL changed),
 * warm the RTK Query cache for the next page so paging forward feels instant.
 *
 * This is the kind of cross-cutting side effect that belongs in listener
 * middleware rather than in a component effect.
 */
startAppListening({
  actionCreator: itemsQueryChanged,
  effect: (action, listenerApi) => {
    const query = action.payload;
    listenerApi.dispatch(
      itemsApi.util.prefetch('getItems', { ...query, page: query.page + 1 }, { force: false }),
    );
  },
});
