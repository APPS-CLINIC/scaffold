import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './store';

/**
 * Listener middleware: the idiomatic place for reactive side effects
 * (prefetching, analytics, cross-slice coordination) without thunks
 * sprinkled through components.
 */
export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

export const addAppListener = addListener.withTypes<RootState, AppDispatch>();
