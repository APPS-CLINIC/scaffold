import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '@/api/baseApi';
import { customerSummaryReducer } from '@/features/customers/customerSummary/customerSummary.slice';
import { urlStateReducer } from '@/features/urlState/urlState.slice';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  urlState: urlStateReducer,
  customerSummary: customerSummaryReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
