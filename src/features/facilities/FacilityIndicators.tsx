import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { InfoPopover, PrimeIcon } from '@/ui';
import type { PrimeIconName } from '@/ui';
import type { FacilityIndicator, FacilityRow } from './facilities.types';

const indicators: readonly {
  kind: FacilityIndicator;
  icon: PrimeIconName;
  labelKey: MessageKey;
}[] = [
  { kind: 'creditAccounts', icon: 'credit-card', labelKey: 'facilities.indicator.creditAccounts' },
  { kind: 'currencies', icon: 'database', labelKey: 'facilities.indicator.currencies' },
  { kind: 'borrowers', icon: 'users', labelKey: 'facilities.indicator.borrowers' },
  { kind: 'collaterals', icon: 'shield', labelKey: 'facilities.indicator.collaterals' },
  { kind: 'structure', icon: 'building', labelKey: 'facilities.indicator.structure' },
  { kind: 'ownership', icon: 'briefcase', labelKey: 'facilities.indicator.ownership' },
  { kind: 'ratings', icon: 'chart-line', labelKey: 'facilities.indicator.ratings' },
];

export interface FacilityIndicatorsProps {
  facility: FacilityRow;
  onOpenRelated: (facility: FacilityRow, indicator: FacilityIndicator) => void;
}

/** Fixed slots: unavailable actions stay grey, with their explanation available on focus. */
export function FacilityIndicators({ facility, onOpenRelated }: FacilityIndicatorsProps) {
  const { t } = useTranslation();
  return (
    <div
      className="inline-flex shrink-0 items-center gap-0.5"
      aria-label={t('facilities.indicators')}
    >
      {indicators.map(({ kind, icon, labelKey }) => {
        const entries = facility.indicators[kind];
        const label = t(labelKey);
        return (
          <InfoPopover
            key={kind}
            label={t('facilities.indicator.info', { label, number: facility.number })}
            muted={entries.length === 0}
            trigger={
              <>
                <PrimeIcon name={icon} className="!text-base" />
                {entries.length > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-1 rounded-full bg-[var(--accent)] px-1 text-[10px] leading-4 text-white"
                  >
                    {entries.length > 9 ? '9+' : entries.length}
                  </span>
                ) : null}
              </>
            }
          >
            <p className="m-0 font-bold">{label}</p>
            {entries.length === 0 ? (
              <p className="mb-0 mt-1">{t('facilities.indicator.unavailable')}</p>
            ) : (
              <>
                <ul className="my-2 flex max-h-48 flex-wrap gap-x-4 gap-y-1 overflow-y-auto pl-4">
                  {entries.map((entry, index) => (
                    <li key={String(index) + entry}>{entry}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="rounded text-inherit underline focus-visible:outline focus-visible:outline-2"
                  onClick={() => onOpenRelated(facility, kind)}
                >
                  {t('facilities.indicator.open')}
                </button>
              </>
            )}
          </InfoPopover>
        );
      })}
    </div>
  );
}
