import { createElement, forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { Card, DefinitionList, Skeleton, twMerge } from 'iwa-react-components';

export interface KeyValueItem {
  /** Stable identity used to preserve the configured row across data updates. */
  id: string;
  label: ReactNode;
  /** Empty values remain visible and render the configured fallback. */
  value?: ReactNode;
}

export interface KeyValueSection {
  /** Stable identity used for rendering and accessible heading association. */
  id: string;
  title: ReactNode;
  items: readonly KeyValueItem[];
}

export interface KeyValueSectionsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  sections: readonly KeyValueSection[];
  /** Replaces `null`, `undefined`, and empty-string values without removing a row. */
  emptyValue?: ReactNode;
  /** Reuses the configured sections and rows while replacing values with IWA skeletons. */
  loading?: boolean;
  /** Heading level used by each named section. */
  headingLevel?: 2 | 3 | 4;
}

function renderValue(value: ReactNode, emptyValue: ReactNode): ReactNode {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  ) {
    return emptyValue;
  }
  if (typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return value;
}

function KeyValueDefinition({
  item,
  emptyValue,
  loading,
}: {
  item: KeyValueItem;
  emptyValue: ReactNode;
  loading: boolean;
}) {
  return (
    <div
      className={twMerge(
        'min-w-0',
        '[&>dl]:grid [&>dl]:grid-cols-1 [&>dl]:items-start [&>dl]:gap-1',
        'sm:[&>dl]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:[&>dl]:gap-x-2',
        'md:[&>dl]:flex md:[&>dl]:gap-4',
        '[&_dt]:w-auto [&_dt]:min-w-0 [&_dt]:shrink [&_dt]:text-left',
        'md:[&_dt]:w-40 md:[&_dt]:shrink-0 md:[&_dt]:text-right',
        'xl:[&_dt]:w-52',
        '[&_dt>div]:break-words [&_dt>div]:text-[var(--text)]',
        '[&_dd]:min-w-0 md:[&_dd]:flex-1 [&_dd>div]:break-words [&_dd>div]:text-[var(--text)]',
      )}
    >
      <DefinitionList
        title={{
          text: (
            <span>
              {item.label}
              <span aria-hidden="true">:</span>
            </span>
          ),
          bold: true,
        }}
        body={{
          text: loading ? (
            <span className="block h-5 w-3/5 overflow-hidden rounded" aria-hidden="true">
              <Skeleton
                width="100%"
                height="100%"
                borderRadius="inherit"
                className="bg-[var(--border-subtle)] align-middle motion-reduce:animate-none"
              />
            </span>
          ) : (
            <span className="block min-h-5 min-w-0">{renderValue(item.value, emptyValue)}</span>
          ),
        }}
      />
    </div>
  );
}

/**
 * Renders ordered, named sections from a small label/value configuration.
 * Each IWA card keeps the section title in a dedicated leading column and
 * composes its rows from IWA definition lists. Loading preserves the exact
 * configured section and row structure, and empty values never collapse it.
 */
export const KeyValueSections = forwardRef<HTMLDivElement, KeyValueSectionsProps>(
  function KeyValueSections(
    {
      sections,
      emptyValue = '–',
      loading = false,
      headingLevel = 2,
      role = 'group',
      className,
      ...rest
    },
    ref,
  ) {
    const instanceId = useId();

    return (
      <div
        ref={ref}
        {...rest}
        role={role}
        aria-busy={loading || undefined}
        className={twMerge('min-w-0 space-y-4', className)}
      >
        {sections.map((section) => {
          const headingId = `${instanceId}-${section.id}-heading`;

          return (
            <Card key={section.id} className="!p-0 [&>.p-card-body]:!p-0">
              <section
                aria-labelledby={headingId}
                className="grid min-w-0 grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-4 lg:gap-6"
              >
                {createElement(
                  `h${headingLevel}`,
                  {
                    id: headingId,
                    className: 'm-0 text-lg font-bold leading-6 text-[var(--text)]',
                  },
                  section.title,
                )}
                <div className="min-w-0 space-y-1 lg:col-span-3">
                  {section.items.map((item) => (
                    <KeyValueDefinition
                      key={item.id}
                      item={item}
                      emptyValue={emptyValue}
                      loading={loading}
                    />
                  ))}
                </div>
              </section>
            </Card>
          );
        })}
      </div>
    );
  },
);
