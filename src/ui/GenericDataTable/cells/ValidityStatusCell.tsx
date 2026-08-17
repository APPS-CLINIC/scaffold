import { useTranslation } from 'react-i18next';
import { Status } from '@/ui';
import type {
  GenericDataTableCellProps,
  GenericDataTableFieldWithValue,
} from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

type ValidityStatus = 'valid' | 'expiring' | 'expired';

export function ValidityStatusCell<
  T extends object,
  K extends GenericDataTableFieldWithValue<T, ValidityStatus>,
>({ value, notAvailable }: GenericDataTableCellProps<T, K>) {
  const { t } = useTranslation();

  switch (value) {
    case 'valid':
      return <Status type="active" label={t('common.status.valid')} />;
    case 'expiring':
      return <Status type="awaiting" label={t('common.status.expiring')} />;
    case 'expired':
      return <Status type="incomplete" label={t('common.status.expired')} />;
    default:
      return renderCellValue(value, notAvailable);
  }
}
