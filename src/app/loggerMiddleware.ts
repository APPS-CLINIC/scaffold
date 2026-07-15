import type { Middleware } from '@reduxjs/toolkit';

/**
 * Minimal dev-only action logger (no extra dependency). For every dispatched
 * action it prints a collapsed console group with the action and the state
 * before/after. Wired up in `store.ts` behind `import.meta.env.DEV`, so it is
 * dead-code-eliminated from production bundles.
 */
export const loggerMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const type =
    typeof action === 'object' && action !== null && 'type' in action
      ? String((action as { type: unknown }).type)
      : '(unknown action)';

  console.groupCollapsed(
    `%caction %c${type} %c@ ${new Date().toLocaleTimeString()}`,
    'color: gray; font-weight: lighter',
    'font-weight: bold',
    'color: gray; font-weight: lighter',
  );
  console.log('%cprev state', 'color: #9e9e9e; font-weight: bold', storeApi.getState());
  console.log('%caction', 'color: #03a9f4; font-weight: bold', action);
  const result = next(action);
  console.log('%cnext state', 'color: #4caf50; font-weight: bold', storeApi.getState());
  console.groupEnd();

  return result;
};
