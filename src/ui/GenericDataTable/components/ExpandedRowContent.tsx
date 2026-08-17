import { useTranslation } from 'react-i18next';
import { DefinitionList } from 'iwa-react-components';
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

/** The accordion body: every field that did not fit as a column, in order. */
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
      <div className="mx-auto flex max-w-lg flex-col gap-y-1 [&_dl]:items-baseline [&_dl]:max-sm:flex-col [&_dl]:max-sm:gap-0 [&_dt]:max-sm:w-auto [&_dt]:max-sm:text-left">
        {fields.map((field) => (
          <DefinitionList
            key={String(field.field)}
            title={{ text: t(field.labelKey), bold: true }}
            body={{
              text: (
                <DetailValue
                  detail={field}
                  labels={labels}
                  locale={locale}
                  row={row}
                  rowIndex={rowIndex}
                />
              ),
            }}
          />
        ))}
      </div>
    </section>
  );
}
