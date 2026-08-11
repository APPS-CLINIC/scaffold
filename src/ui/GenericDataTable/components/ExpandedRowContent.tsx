import { useTranslation } from 'react-i18next';
import type {
  GenericDataTableDetailField,
  GenericDataTableLabels,
} from '../GenericDataTable.types';
import { DetailValue } from './DetailValue';

interface ExpandedRowContentProps<T extends object> {
  details: readonly GenericDataTableDetailField<T>[];
  detailsId: string;
  labels: GenericDataTableLabels<T>;
  locale: string;
  row: T;
  rowIndex: number;
}

export function ExpandedRowContent<T extends object>({
  details,
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
      className="sticky left-0 w-[100cqw] bg-[var(--surface)] px-4 py-2 sm:px-6"
    >
      <dl className="mx-auto grid max-w-lg grid-cols-1 gap-y-1">
        {details.map((detail) => (
          <div
            className="grid min-w-0 grid-cols-1 items-baseline text-xs leading-5 sm:grid-cols-[minmax(9rem,auto)_minmax(0,1fr)] sm:gap-2"
            key={String(detail.field)}
          >
            <dt className="font-semibold text-[var(--muted)] sm:text-right">
              {t(detail.labelKey)}
            </dt>
            <dd className="min-w-0 break-words">
              <DetailValue
                detail={detail}
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
