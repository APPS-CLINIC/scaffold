import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, UserIdentity } from './auth.types';

const initialState: AuthState = {
  status: 'unknown',
  user: null,
  token: null,
};

interface AuthResolvedPayload {
  user: UserIdentity;
  token?: string | null;
}

/**
 * Holds the resolved Entra ID identity and session status. Identity is read
 * once at startup by the bootstrap (URL/header/gateway), then mirrored here so
 * selectors, the API layer (`prepareHeaders`) and route guards share one source.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authResolved(state, action: PayloadAction<AuthResolvedPayload>) {
      state.status = 'authenticated';
      state.user = action.payload.user;
      state.token = action.payload.token ?? null;
    },
    authUnauthenticated(state) {
      state.status = 'unauthenticated';
      state.user = null;
      state.token = null;
    },
    sessionExpired(state) {
      state.status = 'expired';
      state.token = null;
    },
    authCleared() {
      return initialState;
    },
  },
});

export const { authResolved, authUnauthenticated, sessionExpired, authCleared } = authSlice.actions;
export const authReducer = authSlice.reducer;
