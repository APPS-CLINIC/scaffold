import { baseApi } from '@/api/baseApi';
import type {
  FacilityNode,
  FacilityRootsResponse,
  FacilitySnapshot,
  FacilityChildrenResponse,
} from '@/features/facilities';
import { facilitiesPreviewTransport } from './facilitiesPreview.transport';
import type { FacilityChildrenRequest, FacilityPreviewQuery } from './facilitiesPreview.service';

interface PreviewData {
  response: FacilityRootsResponse;
  snapshot: FacilitySnapshot;
  nextRootCursor: string | null;
  rootPageState: 'loaded' | 'loading' | 'error';
}
function fromDto(node: FacilityRootsResponse['nodes'][number]): FacilityNode {
  return {
    ...node,
    children: [],
    childrenState: node.hasChildren ? 'unloaded' : 'loaded',
    nextCursor: null,
  };
}
function find(nodes: readonly FacilityNode[], key: string): FacilityNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    const child = find(node.children, key);
    if (child) return child;
  }
}

/** Development-only service simulation. No invented HTTP path or production fallback. */
const rootsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFacilityPreviewRoots: builder.query<PreviewData, FacilityPreviewQuery>({
      queryFn: async (query, { signal }) => {
        try {
          const response = await facilitiesPreviewTransport.roots(query, signal);
          return {
            data: {
              response,
              nextRootCursor: response.nextCursor,
              rootPageState: 'loaded',
              snapshot: {
                asOf: response.asOf,
                summaries: response.summaries,
                view: response.view,
                nodes: response.nodes.map(fromDto),
              },
            },
          };
        } catch {
          return { error: { status: 'CUSTOM_ERROR', error: 'Could not load the example roots' } };
        }
      },
    }),
  }),
});

export const facilitiesPreviewApi = rootsApi.injectEndpoints({
  endpoints: (builder) => ({
    getFacilityPreviewChildren: builder.query<FacilityChildrenResponse, FacilityChildrenRequest>({
      queryFn: async (arg, { signal }) => {
        try {
          return { data: await facilitiesPreviewTransport.children(arg, signal) };
        } catch {
          return { error: { status: 'CUSTOM_ERROR', error: 'Could not load the example branch' } };
        }
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled, getCacheEntry }) {
        const pending = dispatch(
          rootsApi.util.updateQueryData('getFacilityPreviewRoots', arg.query, (draft) => {
            if (arg.parentKey === null) {
              draft.rootPageState = 'loading';
              return;
            }
            const node = find(draft.snapshot.nodes, arg.parentKey);
            if (node) node.childrenState = 'loading';
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            rootsApi.util.updateQueryData('getFacilityPreviewRoots', arg.query, (draft) => {
              if (arg.parentKey === null) {
                const previous = new Map(draft.snapshot.nodes.map((node) => [node.key, node]));
                for (const node of data.nodes)
                  if (!previous.has(node.key)) previous.set(node.key, fromDto(node));
                draft.snapshot.nodes = [...previous.values()];
                draft.nextRootCursor = data.nextCursor;
                draft.rootPageState = 'loaded';
                return;
              }
              const node = find(draft.snapshot.nodes, arg.parentKey);
              if (!node) return;
              const previous = new Map(node.children.map((child) => [child.key, child]));
              for (const child of data.nodes)
                if (!previous.has(child.key)) previous.set(child.key, fromDto(child));
              node.children = [...previous.values()];
              node.childrenState = 'loaded';
              node.nextCursor = data.nextCursor;
            }),
          );
        } catch {
          const error = getCacheEntry().error;
          if (error && 'name' in error && error.name === 'AbortError') {
            pending.undo();
            return;
          }
          dispatch(
            rootsApi.util.updateQueryData('getFacilityPreviewRoots', arg.query, (draft) => {
              if (arg.parentKey === null) {
                draft.rootPageState = 'error';
                return;
              }
              const node = find(draft.snapshot.nodes, arg.parentKey);
              if (node) node.childrenState = 'error';
            }),
          );
        }
      },
    }),
  }),
});
export const { useGetFacilityPreviewRootsQuery, useLazyGetFacilityPreviewChildrenQuery } =
  facilitiesPreviewApi;
