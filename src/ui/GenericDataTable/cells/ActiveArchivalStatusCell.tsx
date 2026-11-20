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
>({
  value,
  notAvailable,
  labels,
}: GenericDataTableCellProps<T, K> & {
  /** Labels to show instead of the built-in translations, such as a dictionary's. */
  labels?: Partial<Record<ActiveArchivalStatus, string | undefined>>;
}) {
  const { t } = useTranslation();

  switch (value) {
    case 'ACTIVE':
      return (
        <Status
          type="active"
          label={labels?.ACTIVE ?? t('common.status.active')}
          className="[&_*]:!text-sm [&_*]:!leading-5"
        />
      );
    case 'ARCHIVAL':
      return (
        <Status
          type="disabled"
          label={labels?.ARCHIVAL ?? t('common.status.archival')}
          className="[&_*]:!text-sm [&_*]:!leading-5"
        />
      );
    default:
      return renderCellValue(value, notAvailable);
  }
}
