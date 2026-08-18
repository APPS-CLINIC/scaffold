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
      // The real IWA InlineLink truncates overflowing labels to one line with
      // an ellipsis and its overflow-tooltip layer forces a default cursor.
      // Table cells must wrap fully and stay clickable-looking, so force the
      // overrides onto the link and every node inside it.
      className="!cursor-pointer !whitespace-normal break-words font-medium ![text-overflow:clip] [&_*]:!cursor-pointer [&_*]:!whitespace-normal [&_*]:!break-words [&_*]:!overflow-visible [&_*]:![text-overflow:clip]"
      innerWrapperClassName="whitespace-normal break-words"
      label={renderCellValue(value, notAvailable)}
      url={typeof href === 'function' ? href(row) : href}
      openInNewTab={openInNewTab}
    />
  );
}
