import { useTranslation } from 'react-i18next';
import { RichNotification } from '@/ui';
import noCustomersIllustration from './no-customers.svg';

/** What the customer table shows when neither the search nor the filters match a customer. */
export function CustomersNoResults() {
  const { t } = useTranslation();

  return (
    <RichNotification
      // The library takes the illustration as an SVG element.
      illustration={
        <svg aria-hidden="true" width={290} height={203} viewBox="0 0 290 203">
          <image href={noCustomersIllustration} width={290} height={203} />
        </svg>
      }
      title={t('customers.table.noResults.title')}
      paragraph={<p className="m-0 whitespace-pre-line">{t('customers.table.noResults.text')}</p>}
    />
  );
}
