import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CustomerGeneralDataView } from '@/features/customers';

export function CustomerGeneralDataPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <section aria-labelledby="customer-general-data-title">
      <h2 id="customer-general-data-title" className="sr-only">
        {t('nav.customerDetail.generalData')}
      </h2>
      <CustomerGeneralDataView customerId={id} />
    </section>
  );
}
