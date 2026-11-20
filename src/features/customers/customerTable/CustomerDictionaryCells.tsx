import { useDictionary, type StaticDictionary } from '@/features/dictionaries';
import { ActiveArchivalStatusCell, TableCellSkeleton, TextCell } from '@/ui';
import type { GenericDataTableCellProps } from '@/ui';
import type { Customer } from '../customers.types';

/** The customer status, labelled by the dictionary; the built-in translation stands in without it. */
export function CustomerStatusCell(props: GenericDataTableCellProps<Customer, 'status'>) {
  const { labelOf } = useDictionary('customer-status');
  return (
    <ActiveArchivalStatusCell
      {...props}
      labels={{ ACTIVE: labelOf('ACTIVE'), ARCHIVAL: labelOf('ARCHIVAL') }}
    />
  );
}

type CustomerDictionaryField = 'type' | 'tsPriceConditionStatus';

/**
 * A code shown as its dictionary label. A value the dictionary does not know is shown as the
 * service sent it, and so is every value when the dictionary could not be loaded.
 */
export function CustomerDictionaryCell({
  dictionary,
  ...props
}: GenericDataTableCellProps<Customer, CustomerDictionaryField> & {
  dictionary: StaticDictionary;
}) {
  const { labelOf, loading } = useDictionary(dictionary);
  if (loading) return <TableCellSkeleton rowIndex={props.rowIndex} />;
  return <TextCell {...props} value={labelOf(props.value) ?? props.value} />;
}
