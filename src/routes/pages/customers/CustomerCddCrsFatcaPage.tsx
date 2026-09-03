import { useTranslation } from 'react-i18next';
import { CustomerCddCrsFatcaView } from '@/features/customers';
import { useCustomerId } from './useCustomerId';

export function CustomerCddCrsFatcaPage() {
  const { t } = useTranslation();
  const id = useCustomerId();

  return (
    <section aria-labelledby="customer-compliance-title">
      <h2 id="customer-compliance-title" className="sr-only">
        {t('nav.customerDetail.cddCrsFatca')}
      </h2>
      <CustomerCddCrsFatcaView customerId={id} />
    </section>
  );
}
