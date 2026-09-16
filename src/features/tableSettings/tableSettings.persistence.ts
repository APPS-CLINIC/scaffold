import { isAnyOf } from '@reduxjs/toolkit';
import { startAppListening } from '@/app/listenerMiddleware';
import { selectTableSettings } from './tableSettings.selectors';
import { tableColumnsSaved, tableSettingsRestored } from './tableSettings.slice';
import type { TableSettingsStorage } from './tableSettings.storage';

/**
 * Write the whole slice to storage after every save or restore — and only then.
 * The listener middleware is a module singleton shared by every store, so the
 * app shell registers this once, after `makeStore`; the returned function
 * unsubscribes.
 */
export function startTableSettingsPersistence(storage: TableSettingsStorage): () => void {
  return startAppListening({
    matcher: isAnyOf(tableColumnsSaved, tableSettingsRestored),
    effect: (_action, listenerApi) => {
      storage.write(selectTableSettings(listenerApi.getState()));
    },
  });
}
