import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Single RTK Query API instance. Feature endpoints are injected via
 * `baseApi.injectEndpoints(...)` so each feature stays self-contained and
 * code-splittable.
 */

/**
 * Download a file from a `Response` object. The `Content-Disposition` header is
 * used to determine the filename; if not present, the provided default is used.
 */
export async function downloadFileFromResponse(
  response: Response,
  defaultFileName: string,
): Promise<void> {
  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] ?? defaultFileName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return;
}

/** The API root of this environment; the version sits below it. */
const API_ROOT_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

/** The API version every endpoint path is relative to. */
const API_VERSION = 'v1';

// Add `prepareHeaders` here to attach auth tokens once you wire auth.
const createBaseQuery = (baseUrl: string) => fetchBaseQuery({ baseUrl });

/** Reaches the few endpoints outside the versioned API, such as `GET /api/dictionaries`. */
export const apiRootBaseQuery = createBaseQuery(API_ROOT_URL);

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: createBaseQuery(`${API_ROOT_URL}/${API_VERSION}`),
  // Register cache tags here as features add endpoints, so invalidation stays
  // coordinated across the app.
  tagTypes: [],
  // Keep responses cached for a minute after the last subscriber unmounts.
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    getCustomer: builder.query<Record<string, unknown>, number>({
      query: (customerId) => `customer/${customerId}`,
    }),
  }),
});

export const { useGetCustomerQuery } = baseApi;
