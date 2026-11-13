import { useTranslation } from 'react-i18next';
import { ActiveArchivalStatusCell, TextCell, UnderlinedTextCell, twMerge } from '@/ui';
import type { GenericDataTableCellProps } from '@/ui';
import { FacilityIndicators } from './FacilityIndicators';
import type { FacilityIndicatorsProps } from './FacilityIndicators';
import { formatFacilityAmount } from './facilities.formatters';
import type { FacilitiesViewProps } from './FacilitiesView';
import type { FacilityTableRow } from './facilityTable.types';
import { FACILITY_GROUP_LABELS } from './facilityGroupLabels';

type BasicCellProps = GenericDataTableCellProps<FacilityTableRow, 'number'> &
  Pick<FacilitiesViewProps, 'getFacilityHref'> &
  Pick<FacilitiesViewProps, 'onLoadChildren'> &
  Pick<FacilityIndicatorsProps, 'onOpenRelated'>;

/** Feature-specific composition of shared link, status and text cells. */
export function FacilityBasicCell({
  getFacilityHref,
  onOpenRelated,
  onLoadChildren,
  ...props
}: BasicCellProps) {
  const { t } = useTranslation();
  const { row } = props;
  const cellProps = <K extends keyof FacilityTableRow>(field: K) => ({
    ...props,
    field,
    value: row[field],
  });
  return (
    <div
      className={twMerge(
        'inline-flex max-w-full items-start gap-3 align-top',
        row.isContext && 'text-[var(--muted)]',
      )}
    >
      <span
        className="pt-1 text-xs"
        aria-label={t('facilities.level', { level: row.businessLevel })}
      >
        {row.businessLevel}
      </span>
      <FacilityIndicators facility={row.source} onOpenRelated={onOpenRelated} />
      <div className="min-w-0 text-sm leading-5">
        <UnderlinedTextCell {...props} to={getFacilityHref(row.source)} />
        <div>
          <ActiveArchivalStatusCell {...cellProps('status')} />
        </div>
        <div className="font-bold">{t(FACILITY_GROUP_LABELS[row.group])}</div>
        <div>
          <TextCell {...cellProps('type')} />
        </div>
        <div>
          <TextCell {...cellProps('commitment')} />
        </div>
        <div>{t('facilities.contractCurrency', { currency: row.contractCurrency })}</div>
        {row.isContext ? <div className="text-xs">{t('facilities.context')}</div> : null}
        {row.childrenState === 'loading' ? (
          <p className="sr-only" role="status">
            {t('facilities.loadingChildren')}
          </p>
        ) : null}
        {onLoadChildren && (row.childrenState === 'error' || row.nextCursor !== null) ? (
          <button
            type="button"
            disabled={row.childrenState === 'loading'}
            className="rounded text-xs text-[var(--accent)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            onClick={() => {
              void onLoadChildren(row.key).catch(() => undefined);
            }}
          >
            {t(
              row.childrenState === 'error'
                ? 'facilities.retryChildren'
                : 'facilities.moreChildren',
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function FacilityAmountCell({
  row,
  value,
  locale,
}: GenericDataTableCellProps<
  FacilityTableRow,
  'grantedMinor' | 'utilizedMinor' | 'availableMinor'
>) {
  return formatFacilityAmount(value, row.currency, locale);
}

export function FacilityUtilizationCell({
  value,
  locale,
  notAvailable,
}: GenericDataTableCellProps<FacilityTableRow, 'utilization'>) {
  return value === null
    ? notAvailable
    : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value);
}
