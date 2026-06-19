import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/api/baseApi';
import { listenerMiddleware } from './listenerMiddleware';
import { rootReducer, type RootState } from './rootReducer';

// Side-effect import: registers feature listeners on the shared middleware.
import '@/features/items/items.listeners';

/**
 * Store factory. Using a factory (instead of a singleton-only export) keeps
 * tests isolated — every test can spin up a fresh store, optionally with
 * preloaded state — and leaves the door open for SSR.
 */
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        // listener middleware must run before the API middleware.
        .prepend(listenerMiddleware.middleware)
        .concat(baseApi.middleware),
  });

  // Enables refetchOnFocus / refetchOnReconnect behaviors.
  setupListeners(store.dispatch);

  return store;
};

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type { RootState };
