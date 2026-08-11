import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/api/baseApi';
import { listenerMiddleware } from './listenerMiddleware';
import { loggerMiddleware } from './loggerMiddleware';
import { rootReducer, type RootState } from './rootReducer';

/**
 * Action logger only in dev builds (and not under vitest, where it would
 * drown test output). `import.meta.env.DEV` is statically `false` in
 * production builds, so the logger is stripped from the bundle.
 */
const devLogger = import.meta.env.DEV && import.meta.env.MODE !== 'test' ? [loggerMiddleware] : [];

// Keep RTK's batched notifications inside the Vitest microtask lifecycle;
// requestAnimationFrame callbacks can otherwise outlive a torn-down jsdom window.
const testEnhancerOptions =
  import.meta.env.MODE === 'test' ? ({ autoBatch: { type: 'tick' } } as const) : undefined;

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
        .concat(baseApi.middleware)
        .concat(devLogger),
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers(testEnhancerOptions),
  });

  // Enables refetchOnFocus / refetchOnReconnect behaviors.
  setupListeners(store.dispatch);

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type { RootState };
