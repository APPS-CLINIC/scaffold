import { forwardRef, useMemo } from 'react';
import type { ReactElement, Ref, RefAttributes } from 'react';
import { Column } from 'primereact/column';
import { TreeTable } from 'primereact/treetable';
import { ChevronDownIcon } from 'primereact/icons/chevrondown';
import { ChevronRightIcon } from 'primereact/icons/chevronright';
import type { TreeNode } from 'primereact/treenode';
import { twMerge } from 'iwa-react-components';
import { useTranslation } from 'react-i18next';
import { TableCell } from '../GenericDataTable/cells/TableCell';
import type { TreeDataTableProps } from './TreeDataTable.types';

function toPrimeNodes<T>(
  nodes: readonly T[],
  getKey: (row: T) => string,
  getChildren: (row: T) => readonly T[],
  getHasChildren?: (row: T) => boolean,
): TreeNode[] {
  return nodes.map((node) => {
    const children = toPrimeNodes(getChildren(node), getKey, getChildren, getHasChildren);
    return {
      key: getKey(node),
      data: node,
      children,
      leaf: !(getHasChildren?.(node) ?? children.length > 0),
    };
  });
}

function TreeDataTableInner<T extends object>(
  {
    nodes,
    getKey,
    getChildren,
    getHasChildren,
    onExpand,
    config,
    expandedKeys,
    onExpandedKeysChange,
    labels,
    noResults,
    loading = false,
    loadingLabel,
    className,
    ...rest
  }: TreeDataTableProps<T>,
  ref: Ref<HTMLDivElement>,
) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const value = useMemo(
    () => toPrimeNodes(nodes, getKey, getChildren, getHasChildren),
    [nodes, getKey, getChildren, getHasChildren],
  );
  const expanded = useMemo(
    () => Object.fromEntries(expandedKeys.map((key) => [key, true])),
    [expandedKeys],
  );

  return (
    <div ref={ref} className={twMerge('min-w-0 max-w-full', className)} {...rest}>
      {loading ? <p role="status">{loadingLabel}</p> : null}
      <TreeTable
        value={loading ? [] : value}
        expandedKeys={expanded}
        onToggle={(event) =>
          onExpandedKeysChange(Object.keys(event.value).filter((key) => event.value[key]))
        }
        paginator={false}
        onExpand={(event) => onExpand?.(event.node.data as T)}
        emptyMessage={loading ? <span aria-hidden="true" /> : <div role="status">{noResults}</div>}
        tableStyle={{
          minWidth: config.fields.reduce((width, column) => width + column.width, 0),
        }}
        tableClassName="w-full text-sm"
        className="text-[var(--text)] [&_.p-treetable-thead>tr>th]:!bg-[var(--surface)] [&_.p-treetable-thead>tr>th]:!border-b-[var(--navigation-accent)] [&_.p-treetable-tbody>tr>td]:!align-top [&_.p-treetable-tbody>tr>td]:!border-[var(--border-subtle)] [&_.p-treetable-tbody>tr:nth-child(even)]:!bg-[var(--row-striped)] [&_.p-treetable-tbody>tr:hover>td]:!bg-[var(--surface-muted)]"
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
        togglerTemplate={(node, options) => {
          if (node.leaf) {
            return (
              <button
                type="button"
                disabled
                tabIndex={-1}
                aria-hidden="true"
                className="inline-block w-7"
                style={options.buttonStyle}
              />
            );
          }
          const row = node.data as T;
          return (
            <button
              type="button"
              style={options.buttonStyle}
              className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--navigation-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
              aria-label={options.expanded ? labels.collapse(row) : labels.expand(row)}
              aria-expanded={options.expanded}
              onClick={options.onClick}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {options.expanded ? (
                <ChevronDownIcon aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <ChevronRightIcon aria-hidden="true" className="h-3.5 w-3.5" />
              )}
            </button>
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
            headerClassName={column.headerClassName}
            bodyClassName={column.cellClassName}
            pt={{
              headerCell: { className: 'px-3 py-3 font-bold' },
              bodyCell: { role: 'gridcell', className: 'px-3 py-3' },
            }}
            body={(node: TreeNode, options) => (
              <div
                onKeyDown={(event) => event.stopPropagation()}
                className="inline-block max-w-full align-top"
              >
                <TableCell
                  column={column}
                  row={node.data as T}
                  rowIndex={options.rowIndex}
                  locale={locale}
                  notAvailable={labels.notAvailable}
                />
              </div>
            )}
          />
        ))}
      </TreeTable>
    </div>
  );
}

/**
 * Presentational hierarchy with one shared column grid and no pagination.
 * Only the first column indents. Data shape, expansion and queries belong to the owner;
 * PrimeReact nodes and events never cross this boundary.
 */
export const TreeDataTable = forwardRef(TreeDataTableInner) as <T extends object>(
  props: TreeDataTableProps<T> & RefAttributes<HTMLDivElement>,
) => ReactElement;
