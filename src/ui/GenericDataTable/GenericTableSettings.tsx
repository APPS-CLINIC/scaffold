import { TableActions } from '@/ui/TableActions';
import type { GenericTableSettingsProps } from '@/ui/GenericDataTable/GenericDataTable.types.ts';

export function GenericTableSettings<T extends { id: number }>({
  dataContent,
  onExpandedRowKeysChange,
  expandedRowKeys,
  handleExport,
  onOpenSettings,
}: GenericTableSettingsProps<T>) {
  const visibleRowKeys = (dataContent ?? []).map((customer) => String(customer.id));

  return (
    <TableActions
      expandableKeys={visibleRowKeys}
      expandedKeys={expandedRowKeys}
      onExpandedKeysChange={onExpandedRowKeysChange}
      onExport={handleExport}
      onOpenSettings={onOpenSettings}
    />
  );
}
