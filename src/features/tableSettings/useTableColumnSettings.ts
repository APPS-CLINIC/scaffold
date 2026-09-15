import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resolveColumnFields, type GenericDataTableConfig, type GenericDataTableField } from '@/ui';
import { selectStoredTableColumns } from './tableSettings.selectors';
import { tableColumnsSaved, tableSettingsRestored } from './tableSettings.slice';

export interface TableColumnSettingsApi<T extends object> {
  /** The configuration with the user's columns applied; the input reference when not customized. */
  config: GenericDataTableConfig<T>;
  /** The effective column names in order; the configured fields when not customized. */
  columns: readonly GenericDataTableField<T>[];
  /** Persist a column list; a list equal to the configuration default removes the entry instead. */
  saveColumns: (columns: readonly GenericDataTableField<T>[]) => void;
  restoreDefaults: () => void;
}

/**
 * Connects a table configuration to the user's stored column settings. Both
 * returned values keep their references while nothing changes, so a memoized
 * table and its sort-clear effect stay quiet.
 */
export function useTableColumnSettings<T extends object>(
  config: GenericDataTableConfig<T> & { id: string },
): TableColumnSettingsApi<T> {
  const dispatch = useAppDispatch();
  const tableId = config.id;
  const stored = useAppSelector((state) => selectStoredTableColumns(state, tableId));

  const effectiveConfig = useMemo(() => {
    const fields = resolveColumnFields(config.fields, stored);
    return fields === config.fields ? config : { ...config, fields };
  }, [config, stored]);

  const columns = useMemo(
    () => effectiveConfig.fields.map((field) => field.field),
    [effectiveConfig],
  );

  const saveColumns = useCallback(
    (next: readonly GenericDataTableField<T>[]) => {
      const isDefault =
        next.length === config.fields.length &&
        next.every((name, index) => name === config.fields[index]?.field);
      dispatch(
        isDefault
          ? tableSettingsRestored({ tableId })
          : tableColumnsSaved({ tableId, columns: next }),
      );
    },
    [config.fields, dispatch, tableId],
  );

  const restoreDefaults = useCallback(() => {
    dispatch(tableSettingsRestored({ tableId }));
  }, [dispatch, tableId]);

  return { config: effectiveConfig, columns, saveColumns, restoreDefaults };
}
