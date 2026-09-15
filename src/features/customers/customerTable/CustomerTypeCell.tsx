import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import type { GenericDataTableCellProps } from '@/ui';
import type { Customer, CustomerType } from '../customers.types';

/** One translation per enum value; a value without a key is a compile error. */
const labelKeyByCustomerType: Readonly<Record<CustomerType, MessageKey>> = {
  CORPORATE: 'customers.type.corporate',
};

export function CustomerTypeCell({
  value,
  notAvailable,
}: GenericDataTableCellProps<Customer, 'type'>) {
  const { t } = useTranslation();
  return value ? t(labelKeyByCustomerType[value]) : notAvailable;
}
