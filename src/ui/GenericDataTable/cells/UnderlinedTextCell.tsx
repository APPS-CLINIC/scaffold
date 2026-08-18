import { InlineLink } from '@/ui';
import type { GenericDataTableCellProps, GenericDataTableField } from '../GenericDataTable.types';
import { renderCellValue } from './cellValue';

export interface UnderlinedTextCellProps<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
> extends GenericDataTableCellProps<T, K> {
  /** Renders the value as a real link; derive the URL from the row. */
  href?: string | ((row: T) => string);
  openInNewTab?: boolean;
}

export function UnderlinedTextCell<
  T extends object,
  K extends GenericDataTableField<T> = GenericDataTableField<T>,
>({ value, row, notAvailable, href, openInNewTab }: UnderlinedTextCellProps<T, K>) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean' &&
      typeof value !== 'bigint')
  ) {
    return notAvailable;
  }

  return (
    <InlineLink
      size="small"
      className="whitespace-normal break-words font-medium"
      // The real IWA InlineLink truncates long labels with an ellipsis on its
      // inner wrapper (its "Label Overflow" behavior); table cells must wrap
      // instead, so override that wrapper too.
      innerWrapperClassName="whitespace-normal break-words"
      label={renderCellValue(value, notAvailable)}
      url={typeof href === 'function' ? href(row) : href}
      openInNewTab={openInNewTab}
    />
  );
}
