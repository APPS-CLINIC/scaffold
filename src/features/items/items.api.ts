import { baseApi } from '@/api/baseApi';
import type { ItemsQuery } from '@/features/urlState/urlState.schema';
import { queryMockItems } from './items.mock';
import type { ItemsPage } from './items.types';

export const itemsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getItems: build.query<ItemsPage, ItemsQuery>({
      /**
       * Mock implementation. For a real backend, delete `queryFn` and use:
       *
       *   query: (q) => ({ url: 'items', params: q }),
       *
       * The component/selector code does not change.
       */
      queryFn: async (query) => {
        const data = await queryMockItems(query);
        return { data };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.rows.map((row) => ({ type: 'Item' as const, id: row.id })),
              { type: 'Item' as const, id: 'LIST' },
            ]
          : [{ type: 'Item' as const, id: 'LIST' }],
    }),
  }),
});

export const { useGetItemsQuery } = itemsApi;
