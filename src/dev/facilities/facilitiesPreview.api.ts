import { baseApi } from '@/api/baseApi';
import { FACILITY_LOAD_STATE } from '@/features/facilities';
import type {
  FacilityLoadState,
  FacilityNode,
  FacilityRootsResponse,
  FacilitySnapshot,
  FacilityChildrenResponse,
} from '@/features/facilities';
import { getFacilitiesPreviewTransport } from './facilitiesPreview.transport';
import type { FacilityChildrenRequest, FacilityPreviewQuery } from './facilitiesPreview.service';

interface PreviewData {
  response: FacilityRootsResponse;
  snapshot: FacilitySnapshot;
  nextRootCursor: string | null;
  /** The root list is never unloaded: the first page arrives with the response. */
  rootPageState: Exclude<FacilityLoadState, typeof FACILITY_LOAD_STATE.unloaded>;
}
function fromDto(node: FacilityRootsResponse['nodes'][number]): FacilityNode {
  return {
    ...node,
    children: [],
    childrenState: node.hasChildren ? FACILITY_LOAD_STATE.unloaded : FACILITY_LOAD_STATE.loaded,
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
      queryFn: async (query, { signal, extra }) => {
        try {
          const response = await getFacilitiesPreviewTransport(extra).roots(query, signal);
          return {
            data: {
              response,
              nextRootCursor: response.nextCursor,
              rootPageState: FACILITY_LOAD_STATE.loaded,
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
      queryFn: async (arg, { signal, extra }) => {
        try {
          return { data: await getFacilitiesPreviewTransport(extra).children(arg, signal) };
        } catch {
          return { error: { status: 'CUSTOM_ERROR', error: 'Could not load the example branch' } };
        }
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled, getCacheEntry }) {
        const pending = dispatch(
          rootsApi.util.updateQueryData('getFacilityPreviewRoots', arg.query, (draft) => {
            if (arg.parentKey === null) {
              draft.rootPageState = FACILITY_LOAD_STATE.loading;
              return;
            }
            const node = find(draft.snapshot.nodes, arg.parentKey);
            if (node) node.childrenState = FACILITY_LOAD_STATE.loading;
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
                draft.rootPageState = FACILITY_LOAD_STATE.loaded;
                return;
              }
              const node = find(draft.snapshot.nodes, arg.parentKey);
              if (!node) return;
              const previous = new Map(node.children.map((child) => [child.key, child]));
              for (const child of data.nodes)
                if (!previous.has(child.key)) previous.set(child.key, fromDto(child));
              node.children = [...previous.values()];
              node.childrenState = FACILITY_LOAD_STATE.loaded;
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
                draft.rootPageState = FACILITY_LOAD_STATE.error;
                return;
              }
              const node = find(draft.snapshot.nodes, arg.parentKey);
              if (node) node.childrenState = FACILITY_LOAD_STATE.error;
            }),
          );
        }
      },
    }),
  }),
});
export const { useGetFacilityPreviewRootsQuery, useLazyGetFacilityPreviewChildrenQuery } =
  facilitiesPreviewApi;
