import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CustomerCddCrsFatcaView } from '@/features/customers';

export function CustomerCddCrsFatcaPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <section aria-labelledby="customer-compliance-title">
      <h2 id="customer-compliance-title" className="sr-only">
        {t('nav.customerDetail.cddCrsFatca')}
      </h2>
      <CustomerCddCrsFatcaView customerId={id} />
    </section>
  );
}
