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
      // Name links render as plain text: no underline, no focus outline and no
      // hover effect in any state — color pinned, inner layers ignore the
      // pointer so the library cannot attach hover tooltips/styles (clicks
      // still reach the anchor).
      className="!cursor-pointer !whitespace-normal !text-[#506579] !no-underline !outline-none break-words font-medium ![text-overflow:clip] hover:!text-[#506579] hover:!no-underline focus:!outline-none focus-visible:!outline-none [&_*]:pointer-events-none [&_*]:!cursor-pointer [&_*]:!whitespace-normal [&_*]:!break-words [&_*]:!no-underline [&_*]:!overflow-visible [&_*]:![text-overflow:clip]"
      innerWrapperClassName="whitespace-normal break-words"
      label={renderCellValue(value, notAvailable)}
      url={typeof href === 'function' ? href(row) : href}
      openInNewTab={openInNewTab}
    />
  );
}
