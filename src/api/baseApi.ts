import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Single RTK Query API instance. Feature endpoints are injected via
 * `baseApi.injectEndpoints(...)` so each feature stays self-contained and
 * code-splittable.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
    // Add `prepareHeaders` here to attach auth tokens once you wire auth.
  }),
  // Register cache tags here as features add endpoints, so invalidation stays
  // coordinated across the app.
  tagTypes: [],
  // Keep responses cached for a minute after the last subscriber unmounts.
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
});
