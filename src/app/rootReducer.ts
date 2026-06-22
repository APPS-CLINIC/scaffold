import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '@/api/baseApi';
import { authReducer } from '@/features/auth/auth.slice';
import { urlStateReducer } from '@/features/urlState/urlState.slice';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  urlState: urlStateReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
