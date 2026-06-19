import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Single RTK Query API instance. Feature endpoints are injected via
 * `baseApi.injectEndpoints(...)` so each feature stays self-contained and
 * code-splittable. See `src/features/items/items.api.ts` for an example.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  }),
  // Centralize cache tags here so invalidation is coordinated across features.
  tagTypes: ['Item'],
  // Keep responses cached for a minute after the last subscriber unmounts.
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
});
