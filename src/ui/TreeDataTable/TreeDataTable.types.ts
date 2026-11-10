import type { HTMLAttributes, ReactNode } from 'react';
import type { GenericDataTableConfig } from '../GenericDataTable/GenericDataTable.types';

export interface TreeDataTableLabels<T> {
  table: string;
  expand: (row: T) => string;
  collapse: (row: T) => string;
  notAvailable: ReactNode;
}

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
