import {
  forwardRef,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { DefinitionList, twMerge } from 'iwa-react-components';
import { renderCellValue } from '../GenericDataTable/cells/cellValue';
import { DataPanelColumnLayout, DataPanelDefinition, DataPanelLayout } from './DataPanelLayout';
import { getDataPanelValueHeightClass, type DataPanelValueSize } from './DataPanelValueGeometry';

export type { DataPanelValueSize } from './DataPanelValueGeometry';

export interface DataPanelFieldRenderContext<TData> {
  data: TData;
  value: unknown;
}

interface DataPanelFieldPresentation {
  id: string;
  /**
   * `summary` renders in the untitled lead group below the header; numbered
   * columns render in the two titled detail sections below it.
   */
  column: 'summary' | 1 | 2;
  /** Keeps richer values and their loading placeholders on the same fixed row height. */
  valueSize?: DataPanelValueSize;
}

/** Presentation metadata shared by loaded rows and their loading placeholders. */
export type DataPanelSkeletonFieldConfig = DataPanelFieldPresentation &
  (
    | { labelKey: MessageKey; valueOnly?: false }
    | {
        /** Use only when the surrounding titled section supplies the field context. */
        valueOnly: true;
        labelKey?: never;
      }
  );

export type DataPanelFieldConfig<TData> = DataPanelSkeletonFieldConfig & {
  /** Raw value; `null`/`undefined`/`''` render as `emptyValue` (never a collapsed/hidden row). */
  value: (data: TData) => unknown;
  /** Optional data-only transform applied before the default renderer. */
  formatValue?: (value: unknown, data: TData) => unknown;
  /** Optional component renderer for values such as IWA labels or statuses. */
  renderValue?: (context: DataPanelFieldRenderContext<TData>) => ReactNode;
};

export interface DataPanelColumnLabels {
  first: MessageKey;
  second: MessageKey;
}

export interface DataPanelProps<TData> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  data: TData;
  /** Rendered in the dedicated icon column, spanning the header and field rows. */
  icon?: ReactNode;
  /** Rendered next to the icon, above the two data columns (e.g. name + status). */
  header?: ReactNode;
  columnLabels?: DataPanelColumnLabels;
  fields: readonly DataPanelFieldConfig<TData>[];
  /** Shown in place of an empty/null/undefined field value — e.g. an en dash. */
  emptyValue: ReactNode;
}

function DataPanelColumn<TData>({
  data,
  titleKey,
  fields,
  emptyValue,
}: {
  data: TData;
  titleKey?: MessageKey;
  fields: readonly DataPanelFieldConfig<TData>[];
  emptyValue: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <DataPanelColumnLayout title={titleKey ? t(titleKey) : undefined}>
      {fields.map((field) => (
        <DataPanelField
          key={field.id}
          label={field.valueOnly ? undefined : t(field.labelKey)}
          field={field}
          data={data}
          emptyValue={emptyValue}
        />
      ))}
    </DataPanelColumnLayout>
  );
}

function DataPanelField<TData>({
  label,
  field,
  data,
  emptyValue,
}: {
  label?: string;
  field: DataPanelFieldConfig<TData>;
  data: TData;
  emptyValue: ReactNode;
}) {
  const renderedValue = renderDataPanelField(field, data, emptyValue);
  const value = (
    <span
      className={twMerge('block min-w-0 truncate', getDataPanelValueHeightClass(field.valueSize))}
      title={renderedValue.title}
    >
      {renderedValue.content}
    </span>
  );

  if (!label) return value;

  return (
    <DataPanelDefinition>
      <DefinitionList
        title={{
          text: (
            <span>
              {label}
              <span aria-hidden="true">:</span>
            </span>
          ),
          bold: true,
        }}
        body={{ text: value }}
      />
    </DataPanelDefinition>
  );
}

function isEmptyValue(value: unknown): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

function renderDataPanelField<TData>(
  field: DataPanelFieldConfig<TData>,
  data: TData,
  emptyValue: ReactNode,
): { content: ReactNode; title?: string } {
  const rawValue = field.value(data);
  if (isEmptyValue(rawValue)) return { content: emptyValue };

  const value = field.formatValue ? field.formatValue(rawValue, data) : rawValue;
  if (isEmptyValue(value)) return { content: emptyValue };

  const title =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : undefined;

  if (field.renderValue) {
    const rendered = field.renderValue({ data, value });
    return isEmptyValue(rendered) ? { content: emptyValue } : { content: rendered, title };
  }

  return { content: renderCellValue(value, emptyValue), title };
}

function DataPanelInner<TData>(
  {
    data,
    icon,
    header,
    columnLabels,
    fields,
    emptyValue,
    className,
    ...rest
  }: DataPanelProps<TData>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const firstColumn = fields.filter((field) => field.column === 1);
  const secondColumn = fields.filter((field) => field.column === 2);
  const summary = fields.filter((field) => field.column === 'summary');

  return (
    <DataPanelLayout
      ref={ref}
      icon={icon}
      header={header}
      className={className}
      {...rest}
      summary={
        summary.length > 0 ? (
          <DataPanelColumn data={data} fields={summary} emptyValue={emptyValue} />
        ) : undefined
      }
      firstColumn={
        <DataPanelColumn
          data={data}
          titleKey={columnLabels?.first}
          fields={firstColumn}
          emptyValue={emptyValue}
        />
      }
      secondColumn={
        <DataPanelColumn
          data={data}
          titleKey={columnLabels?.second}
          fields={secondColumn}
          emptyValue={emptyValue}
        />
      }
    />
  );
}

/**
 * Generic label/value/icon renderer, composed from a field-list config
 * rather than a hardcoded JSX field list — other sections (e.g. the future
 * CDD/CRS/FATCA panel) reuse this by supplying their own `data`/`fields`,
 * nothing else changes. An optional untitled summary group precedes the two
 * data columns, which are always present regardless of which values arrived;
 * supplying an icon adds its dedicated leading column without coupling the
 * renderer to a customer type.
 */
export const DataPanel = forwardRef(DataPanelInner) as <TData>(
  props: DataPanelProps<TData> & RefAttributes<HTMLDivElement>,
) => ReactElement;
