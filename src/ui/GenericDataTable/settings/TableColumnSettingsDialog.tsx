import type { ReactElement } from 'react';
import type { TableColumnSettingsDialogProps } from '../GenericDataTable.types';
import { TableColumnSettingsForm } from './TableColumnSettingsForm';

/**
 * Lets the user pick which fields a table uses and in what order. The owner
 * keeps the effective columns and persists what `onSave` hands over; the
 * dialog owns only its draft, which is discarded on Cancel, close and
 * backdrop click. Nothing renders while closed, so reopening always starts
 * from the current `columns`.
 */
export function TableColumnSettingsDialog<T extends object>({
  open,
  ...formProps
}: TableColumnSettingsDialogProps<T>): ReactElement | null {
  return open ? <TableColumnSettingsForm {...formProps} /> : null;
}
