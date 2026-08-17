import { useTranslation } from 'react-i18next';
import type {
  GenericDataTableCellProps,
  GenericDataTableFieldWithValue,
} from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';
import { StatusIndicator } from './StatusIndicator';

type ActiveArchivalStatus = 'ACTIVE' | 'ARCHIVAL';

export function ActiveArchivalStatusCell<
  T extends object,
  K extends GenericDataTableFieldWithValue<T, ActiveArchivalStatus>,
>({ value, notAvailable }: GenericDataTableCellProps<T, K>) {
  const { t } = useTranslation();

  if (value === 'ACTIVE') {
    return <StatusIndicator label={t('common.status.active')} tone="success" />;
  }

  if (value === 'ARCHIVAL') {
    return <StatusIndicator label={t('common.status.archival')} tone="inactive" />;
  }

  return renderCellValue(value, notAvailable);
}
