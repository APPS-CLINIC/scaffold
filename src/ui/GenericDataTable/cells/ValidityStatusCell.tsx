import { useTranslation } from 'react-i18next';
import type {
  GenericDataTableCellProps,
  GenericDataTableFieldWithValue,
} from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';
import { StatusIndicator } from './StatusIndicator';

type ValidityStatus = 'valid' | 'expiring' | 'expired';

export function ValidityStatusCell<
  T extends object,
  K extends GenericDataTableFieldWithValue<T, ValidityStatus>,
>({ value, notAvailable }: GenericDataTableCellProps<T, K>) {
  const { t } = useTranslation();

  switch (value) {
    case 'valid':
      return <StatusIndicator label={t('common.status.valid')} tone="success" />;
    case 'expiring':
      return <StatusIndicator label={t('common.status.expiring')} tone="warning" />;
    case 'expired':
      return <StatusIndicator label={t('common.status.expired')} tone="warning" />;
    default:
      return renderCellValue(value, notAvailable);
  }
}
