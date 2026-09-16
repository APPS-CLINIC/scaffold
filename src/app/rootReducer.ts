import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '@/api/baseApi';
import { tableSettingsReducer } from '@/features/tableSettings/tableSettings.slice';
import { urlStateReducer } from '@/features/urlState/urlState.slice';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  urlState: urlStateReducer,
  tableSettings: tableSettingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
