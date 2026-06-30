import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Single RTK Query API instance. Feature endpoints are injected via
 * `baseApi.injectEndpoints(...)` so each feature stays self-contained and
 * code-splittable.
 */
/**
 * Minimal shape of the auth slice this layer needs. Typed locally (instead of
 * importing `RootState`) to avoid a baseApi → store → rootReducer → baseApi
 * import cycle.
 */
interface AuthSlicePeek {
  auth: { token: string | null };
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
    // Forward the Entra ID bearer token to the OKAPI gateway when present.
    // The gateway may also inject identity headers server-side; this is the
    // client-side seam.
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as AuthSlicePeek).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  // Register cache tags here as features add endpoints, so invalidation stays
  // coordinated across the app.
  tagTypes: [],
  // Keep responses cached for a minute after the last subscriber unmounts.
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
});
