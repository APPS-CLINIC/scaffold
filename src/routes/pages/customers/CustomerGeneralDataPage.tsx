import { useTranslation } from 'react-i18next';
import { CustomerGeneralDataView } from '@/features/customers';
import { useCustomerId } from './useCustomerId';

export function CustomerGeneralDataPage() {
  const { t } = useTranslation();
  const id = useCustomerId();

  return (
    <section aria-labelledby="customer-general-data-title">
      <h2 id="customer-general-data-title" className="sr-only">
        {t('nav.customerDetail.generalData')}
      </h2>
      <CustomerGeneralDataView customerId={id} />
    </section>
  );
}
