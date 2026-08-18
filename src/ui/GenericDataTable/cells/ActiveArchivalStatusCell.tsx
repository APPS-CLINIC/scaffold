import { useTranslation } from 'react-i18next';
import { Status } from '@/ui';
import type {
  GenericDataTableCellProps,
  GenericDataTableFieldWithValue,
} from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

type ActiveArchivalStatus = 'ACTIVE' | 'ARCHIVAL';

export function ActiveArchivalStatusCell<
  T extends object,
  K extends GenericDataTableFieldWithValue<T, ActiveArchivalStatus>,
>({ value, notAvailable }: GenericDataTableCellProps<T, K>) {
  const { t } = useTranslation();

  switch (value) {
    case 'ACTIVE':
      return (
        <Status
          type="active"
          label={t('common.status.active')}
          className="[&_*]:!text-sm [&_*]:!leading-5"
        />
      );
    case 'ARCHIVAL':
      return (
        <Status
          type="disabled"
          label={t('common.status.archival')}
          className="[&_*]:!text-sm [&_*]:!leading-5"
        />
      );
    default:
      return renderCellValue(value, notAvailable);
  }
}
