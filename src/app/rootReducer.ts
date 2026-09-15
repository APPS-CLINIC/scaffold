import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '@/api/baseApi';
import { urlStateReducer } from '@/features/urlState/urlState.slice';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  urlState: urlStateReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
