import { DefinitionList, Skeleton, twMerge } from 'iwa-react-components';
import { forwardRef, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { DataPanelColumnLabels, DataPanelSkeletonFieldConfig } from './DataPanel';
import { DataPanelColumnLayout, DataPanelDefinition, DataPanelLayout } from './DataPanelLayout';
import { getDataPanelValueHeightClass } from './DataPanelValueGeometry';

export interface DataPanelSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The same presentation metadata used by DataPanel. Translated labels stay
   * invisible but in-flow so their responsive wrapping reserves exact height. */
  fields: readonly DataPanelSkeletonFieldConfig[];
  columnLabels?: DataPanelColumnLabels;
  hasIcon?: boolean;
  /** Matches either a regular field icon or a large hero-panel icon. */
  iconSize?: 'default' | 'hero';
  hasHeader?: boolean;
}

function DataPanelSkeletonColumn({ fields }: { fields: readonly DataPanelSkeletonFieldConfig[] }) {
  const { t } = useTranslation();

  return (
    <>
      {fields.map((field) => (
        <DataPanelDefinition key={field.id}>
          <DefinitionList
            title={{
              text: (
                <span className="relative block min-h-5">
                  <span className="invisible block">{t(field.labelKey)}</span>
                  <span className="absolute left-0 top-0 block h-5 w-2/3 overflow-hidden rounded">
                    <Skeleton
                      width="100%"
                      height="100%"
                      borderRadius="inherit"
                      className="bg-[var(--border-subtle)] align-middle motion-reduce:animate-none"
                    />
                  </span>
                </span>
              ),
            }}
            body={{
              text: (
                <span
                  className={twMerge(
                    'block w-4/5 overflow-hidden rounded',
                    getDataPanelValueHeightClass(field.valueSize),
                  )}
                >
                  <Skeleton
                    width="100%"
                    height="100%"
                    borderRadius="inherit"
                    className="bg-[var(--border-subtle)] align-middle motion-reduce:animate-none"
                  />
                </span>
              ),
            }}
          />
        </DataPanelDefinition>
      ))}
    </>
  );
}

/**
 * Mirrors DataPanel's grid and translated field labels exactly so swapping
 * skeleton -> real data does not shift even when labels wrap responsively.
 */
export const DataPanelSkeleton = forwardRef<HTMLDivElement, DataPanelSkeletonProps>(
  function DataPanelSkeleton(
    { fields, columnLabels, hasIcon, iconSize = 'default', hasHeader, className, ...rest },
    ref,
  ) {
    const { t } = useTranslation();
    const firstColumn = fields.filter((field) => field.column === 1);
    const secondColumn = fields.filter((field) => field.column === 2);

    return (
      <DataPanelLayout
        ref={ref}
        {...rest}
        aria-hidden="true"
        className={className}
        icon={
          hasIcon ? (
            <span
              className={twMerge(
                'block overflow-hidden rounded-full',
                iconSize === 'hero' ? 'size-24' : 'size-12',
              )}
            >
              <Skeleton
                width="100%"
                height="100%"
                borderRadius="inherit"
                className="bg-[var(--border-subtle)] motion-reduce:animate-none"
              />
            </span>
          ) : undefined
        }
        header={
          hasHeader ? (
            <div className="flex min-w-0 items-center gap-4">
              <span className="block h-7 min-w-0 flex-1">
                <span className="block h-full w-2/5 overflow-hidden rounded">
                  <Skeleton
                    width="100%"
                    height="100%"
                    borderRadius="inherit"
                    className="bg-[var(--border-subtle)] motion-reduce:animate-none"
                  />
                </span>
              </span>
              <span className="block h-5 w-20 shrink-0 overflow-hidden rounded">
                <Skeleton
                  width="100%"
                  height="100%"
                  borderRadius="inherit"
                  className="bg-[var(--border-subtle)] motion-reduce:animate-none"
                />
              </span>
            </div>
          ) : undefined
        }
        firstColumn={
          <DataPanelColumnLayout title={columnLabels?.first ? t(columnLabels.first) : undefined}>
            <DataPanelSkeletonColumn fields={firstColumn} />
          </DataPanelColumnLayout>
        }
        secondColumn={
          <DataPanelColumnLayout title={columnLabels?.second ? t(columnLabels.second) : undefined}>
            <DataPanelSkeletonColumn fields={secondColumn} />
          </DataPanelColumnLayout>
        }
      />
    );
  },
);
