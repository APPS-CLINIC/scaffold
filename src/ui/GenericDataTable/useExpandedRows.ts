import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GenericDataTableDataKey } from './GenericDataTable.types';

export type ExpandedRowMap = Record<string, boolean>;

interface UseExpandedRowsOptions<T extends object> {
  dataKey: GenericDataTableDataKey<T>;
  expandedRowKeys?: readonly string[];
  singleRowExpansion: boolean;
  onExpandedRowKeysChange?: (keys: readonly string[]) => void;
}

function createExpandedRowMap(keys: readonly string[] = []): ExpandedRowMap {
  const expandedRows = Object.create(null) as ExpandedRowMap;
  for (const key of keys) expandedRows[key] = true;
  return expandedRows;
}

function getNextExpandedRows(
  current: ExpandedRowMap,
  rowKey: string,
  singleRowExpansion: boolean,
): ExpandedRowMap {
  if (current[rowKey] === true) {
    return createExpandedRowMap(Object.keys(current).filter((key) => key !== rowKey));
  }

  if (singleRowExpansion) return createExpandedRowMap([rowKey]);

  return createExpandedRowMap([...Object.keys(current), rowKey]);
}

export function useExpandedRows<T extends object>({
  dataKey,
  expandedRowKeys,
  singleRowExpansion,
  onExpandedRowKeysChange,
}: UseExpandedRowsOptions<T>) {
  const [localExpandedRows, setLocalExpandedRows] = useState<ExpandedRowMap>(createExpandedRowMap);
  const localExpandedRowsRef = useRef(localExpandedRows);
  const isControlled = expandedRowKeys !== undefined;
  const controlledExpandedRows = useMemo(
    () => (isControlled ? createExpandedRowMap(expandedRowKeys) : undefined),
    [expandedRowKeys, isControlled],
  );
  const expandedRows = controlledExpandedRows ?? localExpandedRows;
  // PrimeReact memoizes body cells, so an expander cell whose props did not
  // change keeps calling the toggleRow from an earlier render. Reading the
  // controlled keys through a ref makes every toggle start from the latest set.
  const controlledExpandedRowsRef = useRef(controlledExpandedRows);
  useLayoutEffect(() => {
    controlledExpandedRowsRef.current = controlledExpandedRows;
  }, [controlledExpandedRows]);

  const getRowKey = useCallback((row: T) => String(row[dataKey]), [dataKey]);

  const isExpanded = useCallback(
    (row: T) => expandedRows[getRowKey(row)] === true,
    [expandedRows, getRowKey],
  );

  const toggleRow = useCallback(
    (row: T) => {
      const rowKey = getRowKey(row);
      const latestControlledExpandedRows = controlledExpandedRowsRef.current;

      if (latestControlledExpandedRows) {
        const next = getNextExpandedRows(latestControlledExpandedRows, rowKey, singleRowExpansion);
        onExpandedRowKeysChange?.(Object.keys(next));
        return;
      }

      const next = getNextExpandedRows(localExpandedRowsRef.current, rowKey, singleRowExpansion);
      localExpandedRowsRef.current = next;
      setLocalExpandedRows(next);
      onExpandedRowKeysChange?.(Object.keys(next));
    },
    [getRowKey, onExpandedRowKeysChange, singleRowExpansion],
  );

  return { expandedRows, getRowKey, isExpanded, toggleRow };
}
