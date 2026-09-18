import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import { ActionLink } from '@/ui';
import { CustomerFieldGroups, type CustomerFieldGroup } from './CustomerFields';
import { EMPTY_CUSTOMER_DETAILS } from './customerDetails.adapter';
import { isAwaitingData, useGetCustomerDetailsQuery } from './customerDetails.api';
import { useCustomerFormatters } from './customerDetails.formatters';

export interface CustomerFmBasicDataProps {
  customerId: string;
}

/** The "Basic data" part of the FM data section: group and row order follow the design. */
export function CustomerFmBasicData({ customerId }: CustomerFmBasicDataProps) {
  const { t, i18n } = useTranslation();
  const format = useCustomerFormatters();
  const detailsQuery = useGetCustomerDetailsQuery(customerId);
  const details = detailsQuery.currentData ?? EMPTY_CUSTOMER_DETAILS;
  const loading = isAwaitingData(detailsQuery);
  const { fulfilledTimeStamp, refetch } = detailsQuery;

  const dataAsOf = useMemo(
    () =>
      new Intl.DateTimeFormat(
        i18n.resolvedLanguage ?? i18n.language,
        DATE_DMY_FORMAT_OPTIONS,
      ).format(new Date(fulfilledTimeStamp ?? Date.now())),
    [fulfilledTimeStamp, i18n.language, i18n.resolvedLanguage],
  );

  const groups: readonly CustomerFieldGroup[] = [
    {
      titleKey: 'customers.details.fmData.section.lei',
      rows: [
        { labelKey: 'customers.details.fmData.field.leiCode', value: details.lei.leiCode },
        {
          labelKey: 'customers.details.fmData.field.leiCodeValidityDate',
          value: format.date(details.lei.leiCodeValidityDate),
        },
      ],
    },
    {
      titleKey: 'customers.details.fmData.section.emir',
      rows: [
        {
          labelKey: 'customers.details.fmData.field.emirClassification',
          value: details.emir.emirClassification,
        },
        {
          labelKey: 'customers.details.fmData.field.emirReporting',
          value: format.yesNo(details.emir.emirReporting),
        },
      ],
    },
    {
      titleKey: 'customers.details.fmData.section.cpac',
      rows: [
        {
          labelKey: 'customers.details.fmData.field.cpacClassification',
          value: details.cpac.cpacClassification,
        },
        {
          labelKey: 'customers.details.fmData.field.cpacClassificationDate',
          value: format.date(details.cpac.cpacClassificationDate),
        },
      ],
    },
    {
      titleKey: 'customers.details.fmData.section.mifid',
      rows: [
        {
          labelKey: 'customers.details.fmData.field.mifidClassification',
          value: details.mifid.mifidClassification,
        },
        {
          labelKey: 'customers.details.fmData.field.mifidInterestConflictDate',
          value: format.date(details.mifid.mifidInterestConflictDate),
        },
        {
          labelKey: 'customers.details.fmData.field.mifidPolicyDate',
          value: format.date(details.mifid.mifidPolicyDate),
        },
        {
          labelKey: 'customers.details.fmData.field.mifidTestDate',
          value: format.date(details.mifid.mifidTestDate),
        },
      ],
    },
    {
      titleKey: 'customers.details.fmData.section.mifidTest',
      rows: [
        {
          labelKey: 'customers.details.fmData.field.testM01',
          value: format.yesNo(details.mifid.testM01),
        },
        {
          labelKey: 'customers.details.fmData.field.testM02',
          value: format.yesNo(details.mifid.testM02),
        },
        {
          labelKey: 'customers.details.fmData.field.testM03',
          value: format.yesNo(details.mifid.testM03),
        },
        {
          labelKey: 'customers.details.fmData.field.testM04',
          value: format.yesNo(details.mifid.testM04),
        },
        {
          labelKey: 'customers.details.fmData.field.testM05',
          value: format.yesNo(details.mifid.testM05),
        },
        {
          labelKey: 'customers.details.fmData.field.testM06',
          value: format.yesNo(details.mifid.testM06),
        },
        {
          labelKey: 'customers.details.fmData.field.testM07',
          value: format.yesNo(details.mifid.testM07),
        },
        {
          labelKey: 'customers.details.fmData.field.testM08',
          value: format.yesNo(details.mifid.testM08),
        },
        {
          labelKey: 'customers.details.fmData.field.testM09',
          value: format.yesNo(details.mifid.testM09),
        },
        {
          labelKey: 'customers.details.fmData.field.testM10',
          value: format.yesNo(details.mifid.testM10),
        },
      ],
    },
  ];

  return (
    <div className="min-w-0" aria-busy={loading || undefined}>
      {detailsQuery.isError ? (
        <p role="alert" className="sr-only">
          {t('customers.details.data.error')}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
        <span>{t('customers.dataAsOf')}</span>
        <strong className="font-bold text-[var(--text)]">{dataAsOf}</strong>
        <ActionLink
          icon={
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0 text-[var(--navigation-accent)]"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" />
            </svg>
          }
          label={t('customers.actions.refresh')}
          onClick={async () => {
            await refetch();
          }}
        />
      </div>
      <CustomerFieldGroups groups={groups} loading={loading} layout="balanced" />
    </div>
  );
}
