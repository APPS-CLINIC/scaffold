import type { SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, TabMenu } from '@/ui';
import { CUSTOMER_FM_DATA_PARTS, type CustomerFmDataPart } from './customerFmData.parts';

export interface CustomerFmDataViewProps {
  customerId: string;
  part: CustomerFmDataPart;
  onSelectPart: (part: CustomerFmDataPart) => void;
}

/**
 * Route content for the FM data tab: one card holding the part menu and the active part.
 * The owner keeps the active part in the URL, so this component never stores it.
 */
export function CustomerFmDataView({ part, onSelectPart }: CustomerFmDataViewProps) {
  const { t } = useTranslation();
  const activeIndex = CUSTOMER_FM_DATA_PARTS.findIndex((item) => item.id === part.id);

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
          <h3 className="m-0 text-lg font-bold leading-6 text-[var(--text)]">{t(part.labelKey)}</h3>
          <p className="mt-2 text-[var(--muted)]">{t('section.placeholder')}</p>
        </div>
      </div>
    </Card>
  );
}
