import type { HTMLAttributes, ReactNode } from 'react';

export interface TreeDataTableColumn<T> {
  id: string;
  header: ReactNode;
  renderCell: (row: T) => ReactNode;
  width?: number;
  headerClassName?: string;
  cellClassName?: string;
}

export interface TreeDataTableLabels<T> {
  table: string;
  expand: (row: T) => string;
  collapse: (row: T) => string;
}

export interface TreeDataTableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  nodes: readonly T[];
  getKey: (row: T) => string;
  getChildren: (row: T) => readonly T[];
  columns: readonly TreeDataTableColumn<T>[];
  expandedKeys: readonly string[];
  onExpandedKeysChange: (keys: readonly string[]) => void;
  labels: TreeDataTableLabels<T>;
  noResults: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}
