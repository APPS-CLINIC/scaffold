import { useTranslation } from 'react-i18next';
import type {
  GenericDataTableFieldConfig,
  GenericDataTableLabels,
} from '../GenericDataTable.types';
import { DetailValue } from './DetailValue';

interface ExpandedRowContentProps<T extends object> {
  fields: readonly GenericDataTableFieldConfig<T>[];
  detailsId: string;
  labels: GenericDataTableLabels<T>;
  locale: string;
  row: T;
  rowIndex: number;
}

/**
 * The accordion body: every field that did not fit as a column, in order.
 * Hand-rolled markup on purpose: the IWA DefinitionList types its body text
 * as a string, while detail values here are rendered components — and the
 * accordion must use exactly the table's cell typography (14px/20px).
 */
export function ExpandedRowContent<T extends object>({
  fields,
  detailsId,
  labels,
  locale,
  row,
  rowIndex,
}: ExpandedRowContentProps<T>) {
  const { t } = useTranslation();

  return (
    <section
      id={detailsId}
      aria-labelledby={`${detailsId}-toggle`}
      className="w-full bg-[var(--surface)] px-4 py-2 sm:px-6"
    >
      <dl className="mx-auto grid max-w-lg grid-cols-1 gap-y-1">
        {fields.map((field) => (
          <div
            className="grid min-w-0 grid-cols-1 items-baseline text-sm leading-5 sm:grid-cols-[minmax(9rem,auto)_minmax(0,1fr)] sm:gap-4"
            key={String(field.field)}
          >
            <dt className="font-bold text-[var(--text)] sm:text-right">{t(field.labelKey)}</dt>
            <dd className="m-0 min-w-0 break-words">
              <DetailValue
                detail={field}
                labels={labels}
                locale={locale}
                row={row}
                rowIndex={rowIndex}
              />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
