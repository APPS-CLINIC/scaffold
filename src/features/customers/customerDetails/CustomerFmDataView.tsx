import { useTranslation } from 'react-i18next';
import { CustomerFmBasicData } from './CustomerFmBasicData';
import { CustomerPartsCard } from './CustomerPartsCard';
import {
  CUSTOMER_FM_DATA_PARTS,
  DEFAULT_CUSTOMER_FM_DATA_PART,
  type CustomerFmDataPart,
} from './customerFmData.parts';

export interface CustomerFmDataViewProps {
  customerId: string;
  part: CustomerFmDataPart;
  onSelectPart: (part: CustomerFmDataPart) => void;
}

/** Route content for the FM data tab: one card holding the part menu and the active part. */
export function CustomerFmDataView({ customerId, part, onSelectPart }: CustomerFmDataViewProps) {
  const { t } = useTranslation();
  const showsBasicData = part.id === DEFAULT_CUSTOMER_FM_DATA_PART.id;

  return (
    <CustomerPartsCard
      groupLabelKey="customers.details.fmData.ariaLabel"
      menuLabelKey="customers.details.fmData.menuAriaLabel"
      parts={CUSTOMER_FM_DATA_PARTS}
      activePart={part}
      onSelectPart={onSelectPart}
    >
      {/* The menu already names the part on screen, so the shown part titles itself
          for assistive technology only, above the group headings it owns. */}
      <h3
        className={
          showsBasicData ? 'sr-only' : 'm-0 text-lg font-bold leading-6 text-[var(--text)]'
        }
      >
        {t(part.labelKey)}
      </h3>
      {showsBasicData ? (
        <CustomerFmBasicData customerId={customerId} />
      ) : (
        <p className="mt-2 text-[var(--muted)]">{t('section.placeholder')}</p>
      )}
    </CustomerPartsCard>
  );
}
