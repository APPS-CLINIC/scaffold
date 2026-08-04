import { useTranslation } from 'react-i18next';
import type {
  GenericDataTableCellProps,
  GenericDataTableFieldWithValue,
} from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';
import { StatusIndicator } from './StatusIndicator';

type ActiveInactiveStatus = 'active' | 'inactive';

export function ActiveInactiveStatusCell<
  T extends object,
  K extends GenericDataTableFieldWithValue<T, ActiveInactiveStatus>,
>({ value, notAvailable }: GenericDataTableCellProps<T, K>) {
  const { t } = useTranslation();

  if (value === 'active') {
    return <StatusIndicator label={t('common.status.active')} tone="success" />;
  }

  if (value === 'inactive') {
    return <StatusIndicator label={t('common.status.inactive')} tone="inactive" />;
  }

  return renderCellValue(value, notAvailable);
}
