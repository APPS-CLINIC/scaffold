import { forwardRef, useMemo } from 'react';
import type {
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from 'react';
import { Column } from 'primereact/column';
import { TreeTable } from 'primereact/treetable';
import type { TreeNode } from 'primereact/treenode';
import { twMerge } from 'iwa-react-components';
import { useTranslation } from 'react-i18next';
import { TableCell } from '../GenericDataTable/cells/TableCell';
import { TableCellSkeleton } from '../GenericDataTable/cells/TableCellSkeleton';
import type { GenericDataTableConfig } from '../GenericDataTable/GenericDataTable.types';

export interface TreeDataTableLabels<T> {
  table: string;
  expand: (row: T) => string;
  collapse: (row: T) => string;
  notAvailable: ReactNode;
}

/** Kept with the adapter so its lazy-loading props and implementation stay together. */
export interface TreeDataTableProps<T extends object> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  nodes: readonly T[];
  getKey: (row: T) => string;
  getChildren: (row: T) => readonly T[];
  /** Independent of loaded children: an unloaded branch must still be expandable. */
  getHasChildren?: (row: T) => boolean;
  /** Appends a decorative placeholder beneath a branch while its next page is pending. */
  getChildrenLoading?: (row: T) => boolean;
  onExpand?: (row: T) => void;
  /** Shared field/cell/filter contract; pagination and row-detail settings do not apply. */
  config: Pick<GenericDataTableConfig<T>, 'fields'>;
  expandedKeys: readonly string[];
  onExpandedKeysChange: (keys: readonly string[]) => void;
  labels: TreeDataTableLabels<T>;
  noResults: ReactNode;
  loading?: boolean;
  /** Appends a placeholder for another root page without hiding loaded rows. */
  loadingMore?: boolean;
  loadingLabel?: string;
}

/**
 * Bracket guides, like an editor's bracket-pair guides. An expanded parent opens a bracket in its
 * depth colour at the top of its row; the bracket runs down its visible descendants and closes
 * at the bottom of the last of them.
 * Nested brackets sit side by side in a fixed gutter, so row content never moves.
 */
interface RowGuides {
  /** Structural depth: 0 for roots. Every ancestor bracket passes or closes at this row. */
  depth: number;
  /** An expanded parent with visible children opens the bracket of its own depth. */
  opens: boolean;
  /** Ancestor depths whose bracket ends here because this is their last visible descendant. */
  closes: readonly number[];
}

type TreeRenderData<T> = ({ row: T } | { skeletonIndex: number }) & { guides: RowGuides };

const NO_GUIDES: RowGuides = { depth: 0, opens: false, closes: [] };
/** `--tree-branch-0` … `--tree-branch-5`; deeper brackets reuse the palette. */
const GUIDE_COLOR_COUNT = 6;
const GUIDE_OFFSET = 4;
const GUIDE_PITCH = 6;
const GUIDE_ARM = 6;
const GUIDE_STROKE = 2;
/**
 * A bracket spans whole rows: its top arm sits just inside the parent row's top edge and its
 * bottom arm just inside the last descendant row's bottom edge. The inset keeps a closing
 * bracket from touching the next one that opens directly below it.
 */
const GUIDE_ARM_INSET = 6;
/** 36 px: room for five nested brackets (six business levels) before the toggle. */
const GUIDE_GUTTER_CLASS = 'relative !pl-9';

function skeletonNode(key: string, index: number, guides: RowGuides = NO_GUIDES): TreeNode {
  return {
    key,
    data: { skeletonIndex: index, guides } satisfies TreeRenderData<never>,
    children: [],
    leaf: true,
  };
}

interface PrimeNodeOptions<T> {
  getKey: (row: T) => string;
  getChildren: (row: T) => readonly T[];
  getHasChildren?: (row: T) => boolean;
  getChildrenLoading?: (row: T) => boolean;
  expanded: ReadonlySet<string>;
}

/** `trailing`: brackets that end with this node's subtree, because it is a last child. */
function toPrimeNode<T>(
  node: T,
  options: PrimeNodeOptions<T>,
  depth: number,
  trailing: readonly number[],
): TreeNode {
  const { getKey, getChildren, getHasChildren, getChildrenLoading, expanded } = options;
  const key = getKey(node);
  const items = getChildren(node);
  const childrenLoading = getChildrenLoading?.(node) ?? false;
  const childCount = items.length + (childrenLoading ? 1 : 0);
  const leaf = !(getHasChildren?.(node) ?? childCount > 0);
  const opens = !leaf && expanded.has(key) && childCount > 0;
  // This node's bracket and every bracket it inherited end with its last child.
  const lastChildTrailing = [...trailing, depth];
  const children = items.map((child, index) =>
    toPrimeNode(child, options, depth + 1, index === childCount - 1 ? lastChildTrailing : []),
  );
  if (childrenLoading) {
    children.push(
      skeletonNode(`__loading-${key}`, 0, {
        depth: depth + 1,
        opens: false,
        closes: lastChildTrailing,
      }),
    );
  }
  return {
    key,
    data: {
      row: node,
      guides: { depth, opens, closes: opens ? [] : trailing },
    } satisfies TreeRenderData<T>,
    children,
    leaf,
  };
}

function toPrimeNodes<T>(nodes: readonly T[], options: PrimeNodeOptions<T>): TreeNode[] {
  return nodes.map((node) => toPrimeNode(node, options, 0, []));
}

function guideStroke(depth: number, style: CSSProperties) {
  return (
    <span
      className="absolute"
      style={{ backgroundColor: `var(--tree-branch-${depth % GUIDE_COLOR_COUNT})`, ...style }}
    />
  );
}

/** Decorative: the row's `aria-level` already exposes its depth to assistive technology. */
function BranchGuides({ guides }: { guides: RowGuides }) {
  const brackets: ReactElement[] = [];
  const arm = (depth: number, edge: 'top' | 'bottom') =>
    guideStroke(depth, { [edge]: GUIDE_ARM_INSET, width: GUIDE_ARM, height: GUIDE_STROKE });
  for (let depth = 0; depth <= guides.depth; depth++) {
    const kind =
      depth === guides.depth
        ? guides.opens
          ? 'open'
          : null
        : guides.closes.includes(depth)
          ? 'close'
          : 'through';
    if (!kind) continue;
    brackets.push(
      <span
        key={depth}
        data-guide={kind}
        data-guide-depth={depth}
        className="absolute inset-y-0"
        style={{ left: GUIDE_OFFSET + depth * GUIDE_PITCH }}
      >
        {guideStroke(
          depth,
          kind === 'open'
            ? { top: GUIDE_ARM_INSET, bottom: 0, width: GUIDE_STROKE }
            : kind === 'close'
              ? { top: 0, bottom: GUIDE_ARM_INSET, width: GUIDE_STROKE }
              : { top: 0, bottom: 0, width: GUIDE_STROKE },
        )}
        {kind === 'open' ? arm(depth, 'top') : kind === 'close' ? arm(depth, 'bottom') : null}
      </span>,
    );
  }
  if (!brackets.length) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0">
      {brackets}
    </span>
  );
}

/** Solid caret: orange while a branch is closed, text colour once it is open. */
function ToggleCaret({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 10"
      className={twMerge('h-2.5 w-2 transition-transform', expanded && 'rotate-90')}
    >
      <path d="M0 0 8 5 0 10Z" fill="currentColor" />
    </svg>
  );
}

function TreeDataTableInner<T extends object>(
  {
    nodes,
    getKey,
    getChildren,
    getHasChildren,
    getChildrenLoading,
    onExpand,
    config,
    expandedKeys,
    onExpandedKeysChange,
    labels,
    noResults,
    loading = false,
    loadingMore = false,
    loadingLabel,
    className,
    ...rest
  }: TreeDataTableProps<T>,
  ref: Ref<HTMLDivElement>,
) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const expanded = useMemo(
    () => Object.fromEntries(expandedKeys.map((key) => [key, true])),
    [expandedKeys],
  );
  const value = useMemo(() => {
    if (loading)
      return Array.from({ length: 10 }, (_, index) => skeletonNode(`__loading-${index}`, index));
    const result = toPrimeNodes(nodes, {
      getKey,
      getChildren,
      getHasChildren,
      getChildrenLoading,
      expanded: new Set(expandedKeys),
    });
    if (loadingMore) result.push(skeletonNode('__loading-root-page', 0));
    return result;
  }, [
    nodes,
    getKey,
    getChildren,
    getHasChildren,
    getChildrenLoading,
    expandedKeys,
    loading,
    loadingMore,
  ]);

  return (
    <div ref={ref} className={twMerge('min-w-0 max-w-full', className)} {...rest}>
      {loading || loadingMore ? (
        <span className="sr-only" role="status" aria-live="polite">
          {loadingLabel ?? t('common.loading')}
        </span>
      ) : null}
      <TreeTable
        value={value}
        expandedKeys={expanded}
        onToggle={(event) =>
          onExpandedKeysChange(Object.keys(event.value).filter((key) => event.value[key]))
        }
        paginator={false}
        onExpand={(event) => {
          const data = event.node.data as TreeRenderData<T>;
          if ('row' in data) onExpand?.(data.row);
        }}
        emptyMessage={loading ? <span aria-hidden="true" /> : <div role="status">{noResults}</div>}
        tableStyle={{
          minWidth: config.fields.reduce((width, column) => width + column.width, 0),
        }}
        tableClassName="w-full text-sm"
        className="text-[var(--text)] [&_.p-treetable-thead>tr>th]:!border-b-[var(--navigation-accent)] [&_.p-treetable-tbody>tr>td]:!align-top [&_.p-treetable-tbody>tr>td]:!border-[var(--border-subtle)] [&_.p-treetable-tbody>tr:nth-child(even)]:!bg-[var(--row-striped)] [&_.p-treetable-tbody>tr:hover>td]:!bg-[var(--surface-muted)]"
        pt={{
          root: { role: 'presentation' },
          table: {
            role: 'treegrid',
            'aria-label': labels.table,
            'aria-busy': loading,
            'aria-readonly': true,
          },
          wrapper: { className: 'overflow-x-auto' },
        }}
        // PrimeReact's buttonStyle indents by depth; it is deliberately not applied, so every
        // row starts at the same position and the bracket guides carry the hierarchy.
        togglerTemplate={(node, options) => {
          const data = node.data as TreeRenderData<T>;
          const guides = <BranchGuides guides={data.guides} />;
          if (!('row' in data)) return guides;
          if (node.leaf) {
            return (
              <>
                {guides}
                <span aria-hidden="true" className="mr-1 inline-block h-7 w-7 align-top" />
              </>
            );
          }
          const row = data.row;
          return (
            <>
              {guides}
              <button
                type="button"
                className={twMerge(
                  'mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded align-top focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]',
                  options.expanded ? 'text-[var(--text)]' : 'text-[var(--navigation-accent)]',
                )}
                aria-label={options.expanded ? labels.collapse(row) : labels.expand(row)}
                aria-expanded={options.expanded}
                onClick={options.onClick}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <ToggleCaret expanded={options.expanded} />
              </button>
            </>
          );
        }}
      >
        {config.fields.map((column, index) => (
          <Column
            key={column.field}
            columnKey={column.field}
            header={t(column.labelKey)}
            expander={index === 0}
            style={{ width: column.width }}
            // Merged with the defaults, so a field can replace the header surface (or give its
            // cells one) without out-specifying a table-level selector.
            pt={{
              headerCell: {
                className: twMerge(
                  'px-3 py-3 font-bold !bg-[var(--surface)]',
                  index === 0 && '!pl-9',
                  column.headerClassName,
                ),
              },
              bodyCell: {
                role: 'gridcell',
                className: twMerge(
                  'px-3 py-3',
                  index === 0 && GUIDE_GUTTER_CLASS,
                  column.cellClassName,
                ),
              },
            }}
            body={(node: TreeNode, options) => {
              const data = node.data as TreeRenderData<T>;
              if (!('row' in data)) return <TableCellSkeleton rowIndex={data.skeletonIndex} />;
              return (
                <div
                  onKeyDown={(event) => event.stopPropagation()}
                  className="inline-block max-w-full align-top"
                >
                  <TableCell
                    column={column}
                    row={data.row}
                    rowIndex={options.rowIndex}
                    locale={locale}
                    notAvailable={labels.notAvailable}
                  />
                </div>
              );
            }}
          />
        ))}
      </TreeTable>
    </div>
  );
}

/**
 * Presentational hierarchy with one shared column grid and no pagination.
 * Rows are not indented: every depth starts at the same position. Bracket guides in a fixed
 * gutter of the first column show the hierarchy: each expanded parent opens a bracket in its
 * depth colour (`--tree-branch-<n>`) that closes at its last visible descendant.
 * Data shape, expansion and queries belong to the owner;
 * PrimeReact nodes and events never cross this boundary.
 */
export const TreeDataTable = forwardRef(TreeDataTableInner) as <T extends object>(
  props: TreeDataTableProps<T> & RefAttributes<HTMLDivElement>,
) => ReactElement;
