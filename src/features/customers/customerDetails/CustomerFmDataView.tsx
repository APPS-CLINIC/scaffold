import type { SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, TabMenu } from '@/ui';
import { CustomerFmBasicData } from './CustomerFmBasicData';
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

/**
 * Route content for the FM data tab: one card holding the part menu and the active part.
 * The owner keeps the active part in the URL, so this component never stores it.
 */
export function CustomerFmDataView({ customerId, part, onSelectPart }: CustomerFmDataViewProps) {
  const { t } = useTranslation();
  const activeIndex = CUSTOMER_FM_DATA_PARTS.findIndex((item) => item.id === part.id);
  const showsBasicData = part.id === DEFAULT_CUSTOMER_FM_DATA_PART.id;

  return (
    <Card>
      <div role="group" aria-label={t('customers.details.fmData.ariaLabel')} className="min-w-0">
        <nav aria-label={t('customers.details.fmData.menuAriaLabel')}>
          <TabMenu
            activeIndex={activeIndex}
            items={CUSTOMER_FM_DATA_PARTS.map((item) => ({ label: t(item.labelKey) }))}
            // The prop is typed as Dispatch<SetStateAction<number>>, so it must also accept
            // an updater function; resolve it against the index the URL selects.
            onChangeActiveIndex={(value: SetStateAction<number>) => {
              const index = typeof value === 'function' ? value(activeIndex) : value;
              const selected = CUSTOMER_FM_DATA_PARTS[index];
              if (selected && selected.id !== part.id) onSelectPart(selected);
            }}
          />
        </nav>
        <div className="mt-4 min-w-0">
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
        </div>
      </div>
    </Card>
  );
}
